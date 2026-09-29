import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LEX" },
      { name: "description", content: "Sign in or join the founding community of LEX, the professional workspace for India's legal community." },
      { property: "og:title", content: "Sign in — LEX" },
      { property: "og:description", content: "Join the founding community of LEX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        ...parsed.data,
        options: { emailRedirectTo: window.location.origin + "/home" },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      navigate({ to: "/home" });
    }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth" },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border bg-card p-12 lg:flex">
        <span className="font-serif text-4xl">LEX</span>
        <div>
          <p className="font-serif text-4xl leading-tight">Better lawyers build<br />a brighter India.</p>
          <p className="mt-4 text-muted-foreground">Connect. Learn. Collaborate. Grow.</p>
        </div>
        <p className="text-sm text-muted-foreground">Join the founding community.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <span className="font-serif text-3xl lg:hidden">LEX</span>
          {sent ? (
            <div className="mt-8">
              <h1 className="font-serif text-3xl">Check your inbox</h1>
              <p className="mt-3 text-muted-foreground">We sent a confirmation link to {email}. Open it to continue setting up your profile.</p>
            </div>
          ) : (
            <>
              <h1 className="mt-8 font-serif text-3xl lg:mt-0">{mode === "signin" ? "Welcome back" : "Join LEX"}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "signin" ? "Sign in to your professional workspace." : "Become part of the founding community."}
              </p>
              <Button variant="outline" className="mt-8 w-full" onClick={google}>Continue with Google</Button>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw">Password</Label>
                  <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>
              <button
                className="mt-6 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "New to LEX? Create an account" : "Already a member? Sign in"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
