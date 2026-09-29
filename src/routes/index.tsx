import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LEX — The professional workspace for India's legal community" },
      { name: "description", content: "LEX brings law students, advocates, researchers and firms together to connect, learn, collaborate and grow." },
      { property: "og:title", content: "LEX — The professional workspace for India's legal community" },
      { property: "og:description", content: "Connect. Learn. Collaborate. Grow. Join the founding community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/home", replace: true }));
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-serif text-3xl">LEX</span>
        <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-20">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">For India's legal community</p>
        <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">Your legal journey, in one place.</h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          A professional workspace for law students, advocates, researchers and firms. Connect. Learn. Collaborate. Grow.
        </p>
        <Button asChild size="lg" className="mt-10"><Link to="/auth">Join the founding community</Link></Button>
        <div className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            ["Network", "Build a verified professional identity and connect with peers across courts, chambers and campuses."],
            ["Work", "Private workspaces for moot memorials, research notes and case briefs, with files and tasks."],
            ["Knowledge", "Follow legal updates and keep judgments and articles in your personal library."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-serif text-2xl">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
