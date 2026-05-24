# 🧠 DocuMind AI
> **AI-powered Technical Documentation Generator for Developers**
> Turn any codebase into beautiful, production-grade documentation in seconds.
<p align="center">
  <img alt="Stack" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" />
  <img alt="TanStack Start" src="https://img.shields.io/badge/TanStack_Start-1.x-FF4154" />
  <img alt="Tailwind" src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini_2.5-AI-8E75FF?logo=google&logoColor=white" />
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-Cosmic_3D-000000?logo=threedotjs&logoColor=white" />
</p>
---
## ✨ What is DocuMind AI?
**DocuMind AI** is a full-stack SaaS web application that automatically generates *complete, professional technical documentation* for any codebase — uploaded files, a GitHub repository, or a pasted snippet.
Built for developers, hackathon teams, open-source maintainers, and engineering managers who:
- Hate writing READMEs but love shipping
- Need onboarding docs the moment a new repo lands
- Want a quick **project health score** + improvement checklist
- Want **interview-ready questions** generated straight from the code
DocuMind reads your project, understands it, and produces **9 polished documentation artifacts** in one click.
---
## 🚀 Live Demo
🔗 **[Launch DocuMind AI](https://id-preview--c8692846-6ed6-4a93-8bb6-1f97bd89f7af.lovable.app)**
> Sign up with email or Google in one click — no waitlist, no approval needed.
---
## 🪄 Features
### 🤖 AI Doc Engine (Gemini 2.5 Flash)
For every project, DocuMind generates:
1. 📘 **README.md** — polished, badge-ready, hackathon-grade
2. 🧭 **Overview** — purpose, audience, problem solved
3. 🧱 **Tech Stack** — detected technologies with rationale
4. 🧩 **Function Reference** — per-file summaries (signature + purpose)
5. ⚙️ **Setup Guide** — install, env vars, run commands
6. 🛰️ **API Docs** — auto-detected REST/GraphQL/CLI endpoints
7. 🗂️ **Project Structure** — folder tree + explanation
8. 🔧 **Improvements** — bugs, smells, security findings
9. 💯 **Health Score** — 0–100 quality index
10. 🎯 **Interview Questions** — 8 deep questions derived from your code
### 📥 Three ways to feed it code
- 🗃️ **Drag-and-drop** files / folders
- 🐙 **Paste a GitHub URL** — recursive repo crawl via the GitHub API
- ✂️ **Paste a code snippet**
### 🌌 Cosmic 3D Interface
A signature, premium UI inspired by Linear, Vercel & Notion AI:
- Live **Three.js** scene with two colliding spiral **galaxies** in the background
- Smooth mouse-parallax, 360° rotation, depth fog
- Glassmorphism cards, gradient borders, Framer Motion micro-animations
- Fully responsive — looks gorgeous on mobile and 4K monitors
### 🔐 Auth & Persistence
- Email + Password sign-up (instant, no email verification gate)
- Google OAuth one-click sign-in
- Every generated doc is saved to your private dashboard (RLS-protected)
- Markdown viewer with syntax highlighting, copy-to-clipboard, and download
---
## 🧰 Tech Stack
| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, TanStack Router, Tailwind CSS 4, Framer Motion |
| **3D / Visual** | Three.js (custom galaxy point-cloud shader) |
| **Backend** | TanStack Start server functions (Node 20 / Workers runtime) |
| **AI** | Google Gemini 2.5 Flash via Lovable AI Gateway |
| **Database** | Supabase Postgres (Lovable Cloud) with Row-Level Security |
| **Auth** | Supabase Auth (Email/Password + Google OAuth) |
| **Markdown** | react-markdown, remark-gfm, react-syntax-highlighter |
| **Validation** | Zod |
| **Deployment** | Lovable Cloud (Cloudflare Workers edge) |
---
## 🏗️ Architecture
```
┌──────────────────────────────────────────────────────────────┐
│  React 19  +  TanStack Router  +  Framer Motion  +  Three.js │
│           (Cosmic UI, Dashboard, Markdown Viewer)            │
└──────────────────┬──────────────────────┬────────────────────┘
                   │ useServerFn          │ supabase-js
                   ▼                      ▼
        ┌─────────────────────┐   ┌──────────────────────┐
        │ TanStack Server Fns │   │  Supabase Auth + DB  │
        │  generateDocs()     │   │  profiles, documents │
        │  fetchGithubRepo()  │   │  Row-Level Security  │
        └──────────┬──────────┘   └──────────────────────┘
                   │
                   ▼
        ┌────────────────────────┐
        │ Lovable AI Gateway     │
        │ → Gemini 2.5 Flash     │
        │   (JSON-mode response) │
        └────────────────────────┘
```
---
## 📂 Project Structure
```
src/
├── components/
│   ├── CosmicBackground.tsx     # Three.js galaxy scene
│   ├── MarkdownView.tsx         # Markdown + syntax highlight
│   └── Navbar.tsx
├── hooks/
│   └── useAuth.tsx              # Supabase session hook
├── integrations/supabase/
│   ├── client.ts                # Browser client (RLS)
│   ├── client.server.ts         # Admin client (server-only)
│   ├── auth-middleware.ts       # requireSupabaseAuth
│   └── auth-attacher.ts         # Auto-bearer for serverFn
├── lib/
│   └── generate.functions.ts    # AI engine + GitHub crawler
├── routes/
│   ├── __root.tsx               # Shell + ClientOnly cosmic bg
│   ├── index.tsx                # Landing page
│   ├── login.tsx                # Sign in / Sign up
│   └── dashboard.tsx            # Generator + history
├── styles.css                   # OKLCH design tokens, glass utils
└── start.ts                     # TanStack Start entry
supabase/
└── migrations/                  # profiles + documents tables
```
---
## 🛠️ Local Development
### 1. Clone
```bash
git clone https://github.com/<your-username>/documind-ai.git
cd documind-ai
```
### 2. Install
```bash
bun install      # or: npm install / pnpm install
```
### 3. Environment variables
Create a `.env` file in the project root:
```env
# Supabase (auto-injected on Lovable Cloud)
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
# Server-side (used by Gemini calls)
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
LOVABLE_API_KEY=<lovable-ai-gateway-key>
```
> 💡 On Lovable Cloud all of these are provisioned automatically — no manual setup needed.
### 4. Run
```bash
bun run dev
```
Open [http://localhost:5173](http://localhost:5173) 🚀
### 5. Build
```bash
bun run build
bun run preview
```
---
## 🗄️ Database Schema
Two tables, both RLS-protected so each user only sees their own data:
```sql
profiles (
  id uuid primary key,            -- references auth.users
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz
)
documents (
  id uuid primary key,
  user_id uuid not null,          -- RLS: auth.uid() = user_id
  title text not null,
  source_type text not null,      -- 'files' | 'github' | 'snippet'
  source text,                    -- github URL etc.
  content jsonb not null,         -- the 9 generated artifacts
  created_at timestamptz
)
```
---
## 🧪 How the AI engine works
1. The client collects code (files, GitHub repo, or snippet) and concatenates it with `=== FILE: <path> ===` markers.
2. `generateDocs` server function (`src/lib/generate.functions.ts`) validates input with Zod and calls Gemini 2.5 Flash through the Lovable AI Gateway in **JSON-strict mode**.
3. A carefully tuned system prompt forces the model to return the 9 documentation artifacts in a typed schema.
4. The result is persisted to `documents` and streamed back to the dashboard, where each artifact gets its own tab with copy + download buttons.
---
## 🛡️ Security
- Row-Level Security enabled on every table
- All AI calls happen server-side — the `LOVABLE_API_KEY` never reaches the browser
- `requireSupabaseAuth` middleware protects every server function
- Input validation everywhere via **Zod** (size & shape limits on uploaded code)
- Service-role client (`client.server.ts`) is never imported into client bundles
---
## 🗺️ Roadmap
- [ ] PDF export of full doc bundle
- [ ] One-click "Push README to GitHub" via the GitHub App
- [ ] Multi-file diff-aware regeneration
- [ ] Team workspaces & shareable doc links
- [ ] Custom doc templates (Open Source / Enterprise / Internal)
- [ ] VS Code extension
---
## 🤝 Contributing
PRs, issues, and feature ideas are welcome! Please open an issue first for anything bigger than a typo so we can discuss design.
```bash
git checkout -b feat/your-feature
git commit -m "feat: amazing thing"
git push origin feat/your-feature
```
---
## 📜 License
[MIT](./LICENSE) © 2026 DocuMind AI
---
## 🏆 Hackathon Submission
Built with ❤️ for the hackathon using:
- **Lovable** — full-stack scaffolding, Cloud, and AI Gateway
- **Google Gemini 2.5 Flash** — documentation reasoning
- **Supabase** — auth + Postgres + RLS
- **TanStack Start** — modern SSR React framework
- **Three.js & Framer Motion** — the cosmic UI
> *“Great code deserves great docs. DocuMind makes that automatic.”* 🌌
