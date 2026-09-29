import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe, PRO_TYPE_LABEL, type Profile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/user-avatar";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — LEX" }, { name: "description", content: "Set up your LEX professional profile." }, { property: "og:title", content: "Set up your profile — LEX" }, { property: "og:description", content: "Set up your LEX professional profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Onboarding,
});

const TYPES: { v: NonNullable<Profile["professional_type"]>; d: string }[] = [
  { v: "student", d: "UG, PG or research student, mooter" },
  { v: "advocate", d: "Advocate, associate, partner, counsel" },
  { v: "researcher", d: "Researcher, professor or academic" },
  { v: "firm", d: "Law firm, chambers or legal organization" },
];

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  organization: z.string().trim().max(150),
  interests: z.array(z.string().trim().min(1).max(40)).max(10),
  bio: z.string().trim().max(500),
});

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<Profile["professional_type"]>(null);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [interests, setInterests] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (me?.profile) {
      setName((n) => n || me.profile!.full_name);
      if (me.profile.onboarded) navigate({ to: "/home", replace: true });
    }
  }, [me, navigate]);

  async function finish() {
    const parsed = schema.safeParse({
      full_name: name,
      organization: org,
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
      bio,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    if (!me) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      id: me.user.id,
      ...parsed.data,
      professional_type: type,
      onboarded: true,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["me"] });
    navigate({ to: "/home" });
  }

  const orgLabel = type === "student" || type === "researcher" ? "Institution" : "Organization";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <span className="font-serif text-3xl">LEX</span>
        <p className="mt-8 text-sm text-muted-foreground">Step {step + 1} of 2</p>
        {step === 0 ? (
          <>
            <h1 className="mt-2 font-serif text-4xl">How do you practise law?</h1>
            <p className="mt-2 text-muted-foreground">Your profile adapts to your professional identity.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {TYPES.map((t) => (
                <button
                  key={t.v}
                  onClick={() => setType(t.v)}
                  className={cn(
                    "rounded-xl border bg-card p-5 text-left transition-colors",
                    type === t.v ? "border-primary" : "border-border hover:border-muted-foreground/40",
                  )}
                >
                  <div className="font-medium">{PRO_TYPE_LABEL[t.v]}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t.d}</div>
                </button>
              ))}
            </div>
            <Button className="mt-8" disabled={!type} onClick={() => setStep(1)}>Continue</Button>
          </>
        ) : (
          <>
            <h1 className="mt-2 font-serif text-4xl">Your professional profile</h1>
            <div className="mt-8 space-y-5">
              {me && <AvatarUpload uid={me.user.id} name={name} url={me.profile?.avatar_url} />}
              <div className="space-y-2"><Label>{type === "firm" ? "Firm name" : "Full name"}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>{orgLabel}</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} placeholder={type === "student" ? "e.g. NLSIU Bengaluru" : "e.g. Delhi High Court"} /></div>
              <div className="space-y-2"><Label>Practice areas / interests</Label><Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Arbitration, Data Privacy, Competition Law" /><p className="text-xs text-muted-foreground">Separate with commas.</p></div>
              <div className="space-y-2"><Label>Short bio</Label><Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} /></div>
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={finish} disabled={busy}>Enter LEX</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
