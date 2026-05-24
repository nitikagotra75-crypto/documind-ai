import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  title: z.string().min(1).max(200),
  sourceType: z.enum(["files", "github", "snippet"]),
  source: z.string().max(500).optional(),
  // Concatenated code (truncated client-side). Keep generous but bounded.
  code: z.string().min(1).max(120_000),
});

const SYSTEM = `You are DocuMind AI, an elite technical documentation generator for developers.
Given a codebase (files concatenated with === FILE: <path> === markers), produce STRICT JSON only,
matching this TypeScript type exactly:

{
  "readme": string,           // full polished README.md in markdown
  "overview": string,         // markdown: high-level project overview, purpose, audience
  "techStack": string,        // markdown bullet list of detected technologies w/ reasons
  "functions": string,        // markdown: per-file function summaries (signature + 1-line purpose)
  "setup": string,            // markdown: setup, install, run, env vars
  "apiDocs": string,          // markdown: REST/GraphQL/CLI endpoints found (or "No APIs detected.")
  "structure": string,        // markdown: folder tree + explanation
  "improvements": string,     // markdown bullet list of bugs / improvements / security smells
  "healthScore": number,      // 0-100 integer
  "interviewQuestions": string // markdown numbered list of 8 interview Qs derived from the code
}

Rules:
- Output ONLY valid JSON. No markdown fences around the JSON. No prose outside JSON.
- Inside the string values, use rich markdown with headings, lists, and \`\`\`lang code blocks.
- Infer the project's purpose from code structure & dependencies.
- Be specific. Reference actual file names and function names.`;

export const generateDocs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Project title: ${data.title}\nSource: ${data.sourceType}${data.source ? " (" + data.source + ")" : ""}\n\n=== CODE ===\n${data.code}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      throw new Error(`AI generation failed (${res.status})`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "{}";

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      raw = m ? JSON.parse(m[0]) : { readme: content };
    }
    const s = (k: string, fallback = "") =>
      typeof raw[k] === "string" ? (raw[k] as string) : fallback;
    const doc: DocOut = {
      readme: s("readme"),
      overview: s("overview"),
      techStack: s("techStack"),
      functions: s("functions"),
      setup: s("setup"),
      apiDocs: s("apiDocs"),
      structure: s("structure"),
      improvements: s("improvements"),
      healthScore: typeof raw.healthScore === "number" ? (raw.healthScore as number) : 70,
      interviewQuestions: s("interviewQuestions"),
    };

    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        title: data.title,
        source_type: data.sourceType,
        source: data.source ?? null,
        content: doc as unknown as Record<string, string | number>,
      })
      .select()
      .single();
    if (error) console.error(error);

    return { doc, id: row?.id ?? null };
  });

export interface DocOut {
  readme: string;
  overview: string;
  techStack: string;
  functions: string;
  setup: string;
  apiDocs: string;
  structure: string;
  improvements: string;
  healthScore: number;
  interviewQuestions: string;
}

// ---- GitHub fetch ----
const GhSchema = z.object({ url: z.string().url() });

function parseRepo(url: string) {
  const m = url.match(/github\.com[/:]([^/]+)\/([^/.#?]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

const TEXT_EXT = /\.(ts|tsx|js|jsx|py|go|rs|java|kt|rb|php|cs|c|cpp|h|hpp|swift|css|scss|html|json|yml|yaml|toml|md|sh|env|sql)$/i;
const SKIP_DIR = /(^|\/)(node_modules|dist|build|\.git|\.next|target|venv|__pycache__|\.cache|out)(\/|$)/;

export const fetchGithubRepo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GhSchema.parse(d))
  .handler(async ({ data }) => {
    const parsed = parseRepo(data.url);
    if (!parsed) throw new Error("Invalid GitHub URL");
    const { owner, repo } = parsed;

    const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!repoInfo.ok) throw new Error("Repository not found or private.");
    const info = (await repoInfo.json()) as { default_branch: string; name: string };

    const tree = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${info.default_branch}?recursive=1`,
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (!tree.ok) throw new Error("Could not load repository tree.");
    const treeJson = (await tree.json()) as { tree: Array<{ path: string; type: string; size?: number }> };

    const candidates = treeJson.tree
      .filter((n) => n.type === "blob" && TEXT_EXT.test(n.path) && !SKIP_DIR.test(n.path) && (n.size ?? 0) < 80_000)
      .slice(0, 40);

    let total = 0;
    const parts: string[] = [];
    for (const f of candidates) {
      if (total > 100_000) break;
      const raw = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${info.default_branch}/${f.path}`
      );
      if (!raw.ok) continue;
      const text = (await raw.text()).slice(0, 8000);
      parts.push(`=== FILE: ${f.path} ===\n${text}`);
      total += text.length;
    }
    return { code: parts.join("\n\n"), title: `${owner}/${repo}`, source: data.url };
  });
