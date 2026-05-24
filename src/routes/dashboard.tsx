import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload, Github, FileCode2, Sparkles, Loader2, Copy, Download,
  FileText, Wrench, Network, ListChecks, ServerCog, Lightbulb, Activity, MessagesSquare, LogOut, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateDocs, fetchGithubRepo, type DocOut } from "@/lib/generate.functions";
import Navbar from "@/components/Navbar";
import MarkdownView from "@/components/MarkdownView";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard · DocuMind AI" }] }),
});

const TABS = [
  { id: "readme", label: "README", icon: FileText },
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "techStack", label: "Tech Stack", icon: Wrench },
  { id: "structure", label: "Structure", icon: Network },
  { id: "functions", label: "Functions", icon: ListChecks },
  { id: "setup", label: "Setup", icon: ServerCog },
  { id: "apiDocs", label: "API", icon: FileCode2 },
  { id: "improvements", label: "Suggestions", icon: Lightbulb },
  { id: "interviewQuestions", label: "Interview Qs", icon: MessagesSquare },
] as const;

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [doc, setDoc] = useState<DocOut | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("readme");
  const [ghUrl, setGhUrl] = useState("");
  const [pastedCode, setPastedCode] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const genFn = useServerFn(generateDocs);
  const ghFn = useServerFn(fetchGithubRepo);
  const qc = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("id,title,source_type,created_at,content")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const runGenerate = async (input: { title: string; sourceType: "files" | "github" | "snippet"; source?: string; code: string }) => {
    if (input.code.trim().length < 30) {
      toast.error("Not enough code to analyze (min 30 chars).");
      return;
    }
    setGenerating(true);
    setProgress("Reading code...");
    try {
      await new Promise((r) => setTimeout(r, 400));
      setProgress("Sending to Gemini...");
      const result = await genFn({ data: { ...input, code: input.code.slice(0, 120_000) } });
      setDoc(result.doc);
      setDocTitle(input.title);
      setActiveTab("readme");
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Documentation generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).slice(0, 30);
    const parts: string[] = [];
    for (const f of arr) {
      if (f.size > 200_000) continue;
      const text = await f.text();
      parts.push(`=== FILE: ${f.name} ===\n${text.slice(0, 8000)}`);
    }
    await runGenerate({
      title: arr[0].name.replace(/\.[^.]+$/, "") || "My Project",
      sourceType: "files",
      code: parts.join("\n\n"),
    });
  };

  const handleGithub = async () => {
    if (!ghUrl.trim()) return;
    setGenerating(true);
    setProgress("Fetching repository...");
    try {
      const r = await ghFn({ data: { url: ghUrl } });
      setProgress("Analyzing with Gemini...");
      await runGenerate({ title: r.title, sourceType: "github", source: r.source, code: r.code });
      setGhUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch repo");
      setGenerating(false);
      setProgress("");
    }
  };

  const handleSnippet = async () => {
    await runGenerate({ title: "Pasted Snippet", sourceType: "snippet", code: pastedCode });
    setPastedCode("");
  };

  const openHistory = (h: { title: string; content: unknown }) => {
    setDoc(h.content as DocOut);
    setDocTitle(h.title);
    setActiveTab("readme");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const deleteHistory = async (id: string) => {
    await supabase.from("documents").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["history"] });
  };

  const currentMd = useMemo(() => (doc ? (doc[activeTab] as string) || "" : ""), [doc, activeTab]);

  const copy = () => {
    navigator.clipboard.writeText(currentMd);
    toast.success("Copied to clipboard");
  };
  const download = (filename: string, body: string) => {
    const blob = new Blob([body], { type: "text/markdown" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(u);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hello, <span className="text-gradient">{user.email?.split("@")[0]}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Upload code or paste a GitHub repo to generate docs.</p>
          </div>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main column */}
          <div className="space-y-6">
            {/* Upload area */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Drag/drop */}
              <motion.div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={`glass rounded-2xl p-8 text-center cursor-pointer transition ${dragOver ? "ring-glow scale-[1.01]" : "hover:bg-white/[0.04]"}`}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-9 mx-auto text-primary mb-3" />
                <p className="font-medium">Drop files or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">.ts .py .go .rs .java · up to 30 files</p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                  accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.kt,.rb,.php,.cs,.c,.cpp,.h,.hpp,.swift,.css,.scss,.html,.json,.yml,.yaml,.toml,.md,.sh,.sql,.txt"
                />
              </motion.div>

              {/* GitHub */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Github className="size-5 text-primary" />
                  <p className="font-medium">GitHub Repo Analyzer</p>
                </div>
                <Input
                  placeholder="https://github.com/owner/repo"
                  value={ghUrl}
                  onChange={(e) => setGhUrl(e.target.value)}
                  className="h-11"
                />
                <Button
                  onClick={handleGithub}
                  disabled={generating || !ghUrl}
                  className="w-full mt-3 bg-aurora text-primary-foreground hover:opacity-90 glow"
                >
                  {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Analyze Repository
                </Button>
              </div>
            </div>

            {/* Paste snippet */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileCode2 className="size-5 text-primary" />
                <p className="font-medium">Or paste a code snippet</p>
              </div>
              <textarea
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                rows={6}
                placeholder="Paste your code here..."
                className="w-full glass rounded-xl p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
              <Button
                onClick={handleSnippet}
                disabled={generating || pastedCode.length < 30}
                className="mt-3 bg-aurora text-primary-foreground hover:opacity-90"
              >
                <Sparkles className="size-4" /> Generate from snippet
              </Button>
            </div>

            {/* Generation state / Output */}
            <AnimatePresence mode="wait">
              {generating ? (
                <motion.div
                  key="gen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-10 text-center"
                >
                  <Loader2 className="size-10 mx-auto animate-spin text-primary mb-4" />
                  <p className="font-medium cursor-blink">{progress || "Generating..."}</p>
                  <div className="mt-6 grid md:grid-cols-3 gap-3">
                    {["Parsing", "Reasoning", "Composing"].map((s) => (
                      <div key={s} className="glass rounded-xl p-4 text-xs text-muted-foreground">
                        <div className="h-2 rounded-full bg-aurora/40 mb-2 overflow-hidden">
                          <div className="h-full w-1/2 bg-aurora animate-pulse" />
                        </div>
                        {s}…
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : doc ? (
                <motion.div
                  key="doc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl overflow-hidden"
                >
                  <div className="p-5 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-aurora grid place-items-center">
                        <Sparkles className="size-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{docTitle}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Activity className="size-3" /> Health score:{" "}
                          <span className="text-gradient font-semibold">{doc.healthScore}/100</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copy}><Copy className="size-3.5" /> Copy</Button>
                      <Button variant="outline" size="sm" onClick={() => download(`${activeTab}.md`, currentMd)}>
                        <Download className="size-3.5" /> Section
                      </Button>
                      <Button size="sm" className="bg-aurora text-primary-foreground" onClick={() => download("README.md", doc.readme)}>
                        <Download className="size-3.5" /> README.md
                      </Button>
                    </div>
                  </div>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <div className="px-3 pt-3 overflow-x-auto">
                      <TabsList className="bg-transparent gap-1 flex-wrap h-auto">
                        {TABS.map((t) => (
                          <TabsTrigger key={t.id} value={t.id} className="data-[state=active]:bg-aurora data-[state=active]:text-primary-foreground">
                            <t.icon className="size-3.5" /> {t.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    {TABS.map((t) => (
                      <TabsContent key={t.id} value={t.id} className="p-6 max-h-[70vh] overflow-y-auto">
                        <MarkdownView content={(doc[t.id] as string) || "_No content generated for this section._"} />
                      </TabsContent>
                    ))}
                  </Tabs>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-2xl p-12 text-center text-muted-foreground"
                >
                  <Sparkles className="size-8 mx-auto mb-3 text-primary animate-float" />
                  Your generated documentation will appear here.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <p className="text-sm font-semibold mb-3">Recent Projects</p>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No projects yet. Generate your first doc!</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {history.map((h) => (
                    <div key={h.id} className="group glass rounded-xl p-3 hover:bg-white/[0.06] transition">
                      <button onClick={() => openHistory(h)} className="text-left w-full">
                        <p className="text-sm font-medium truncate">{h.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {h.source_type} · {new Date(h.created_at).toLocaleDateString()}
                        </p>
                      </button>
                      <button
                        onClick={() => deleteHistory(h.id)}
                        className="mt-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition flex items-center gap-1"
                      >
                        <Trash2 className="size-3" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
