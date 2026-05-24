import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in · DocuMind AI" }] }),
});

function LoginPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Welcome aboard! Signing you in...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) {
      toast.error(r.error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-8 ring-glow"
      >
        <div className="text-center mb-8">
          <div className="size-12 mx-auto rounded-2xl bg-aurora grid place-items-center glow mb-4">
            <Sparkles className="size-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "Free instant access. No credit card." : "Sign in to your DocuMind workspace."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={google}
          disabled={loading}
          className="w-full glass h-11"
        >
          <svg viewBox="0 0 24 24" className="size-4">
            <path fill="#fff" d="M12 11v2.8h6.6c-.3 1.6-2 4.6-6.6 4.6-4 0-7.2-3.3-7.2-7.4S8 3.6 12 3.6c2.3 0 3.8.9 4.7 1.8l3.2-3.1C17.9.7 15.2 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.9 0 11.5-4.8 11.5-11.7 0-.8-.1-1.4-.2-2L12 11z"/>
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
          <div className="h-px bg-border flex-1" /> or <div className="h-px bg-border flex-1" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="size-4 absolute left-3 top-3 text-muted-foreground" />
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" placeholder="you@galaxy.dev" />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className="size-4 absolute left-3 top-3 text-muted-foreground" />
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-11" placeholder="••••••••" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-aurora text-primary-foreground hover:opacity-90 glow">
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New to DocuMind?"}{" "}
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary hover:underline">
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
