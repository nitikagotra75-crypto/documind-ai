import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between glass rounded-b-2xl">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-9 rounded-xl bg-aurora grid place-items-center glow">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            DocuMind <span className="text-gradient">AI</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#stack" className="hover:text-foreground transition">Tech Stack</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={() => signOut()}>
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/login" })}>
                Sign in
              </Button>
              <Button
                onClick={() => navigate({ to: "/login", search: { mode: "signup" } as never })}
                className="bg-aurora text-primary-foreground hover:opacity-90 glow"
              >
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
