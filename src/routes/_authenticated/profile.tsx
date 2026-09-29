import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AvatarUpload } from "@/components/user-avatar";
import { useMe, PRO_TYPE_LABEL } from "@/lib/auth";
import { updateMyProfile } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [
    { title: "Profile — LEX" },
    { name: "description", content: "View and edit your LEX professional identity." },
    { property: "og:title", content: "Profile — LEX" },
    { property: "og:description", content: "View and edit your LEX professional identity." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const saveProfile = useServerFn(updateMyProfile);
  const p = me?.profile;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");

  useEffect(() => {
    if (!p || editing) return;
    setName(p.full_name);
    setTitle(p.professional_title ?? "");
    setOrganization(p.organization ?? "");
    setBio(p.bio ?? "");
    setInterests(p.interests.join(", "));
  }, [p, editing]);

  async function save() {
    const parsedInterests = interests.split(",").map((item) => item.trim()).filter(Boolean);
    if (name.trim().length < 2) { toast.error("Enter your name"); return; }
    if (name.trim().length > 100 || title.trim().length > 100 || organization.trim().length > 150 || bio.trim().length > 500) {
      toast.error("One or more profile details are too long");
      return;
    }
    if (parsedInterests.length > 10 || parsedInterests.some((item) => item.length > 40)) {
      toast.error("Add up to 10 interests, with 40 characters each");
      return;
    }

    setSaving(true);
    try {
      await saveProfile({ data: { fullName: name, professionalTitle: title, organization, bio, interests: parsedInterests } });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your profile could not be saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-4xl">Profile</h1>
          {p && !editing && <Button variant="outline" onClick={() => setEditing(true)}><Pencil />Edit profile</Button>}
        </div>
        {me && p && (
          <div className="glass-surface mt-8 rounded-2xl p-6 md:p-8">
            <AvatarUpload uid={me.user.id} name={p.full_name} url={p.avatar_url} />
            {editing ? (
              <div className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="profile-title">Professional title</Label><Input id="profile-title" value={title} maxLength={100} placeholder="e.g. Senior Associate" onChange={(event) => setTitle(event.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="profile-organization">Organization or institution</Label><Input id="profile-organization" value={organization} maxLength={150} placeholder="e.g. Delhi High Court" onChange={(event) => setOrganization(event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="profile-interests">Practice areas / interests</Label><Input id="profile-interests" value={interests} placeholder="Arbitration, Data Privacy, Competition Law" onChange={(event) => setInterests(event.target.value)} /><p className="text-xs text-muted-foreground">Separate interests with commas.</p></div>
                <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="profile-bio">Short bio</Label><span className="text-xs text-muted-foreground">{bio.length}/500</span></div><Textarea id="profile-bio" rows={5} value={bio} maxLength={500} onChange={(event) => setBio(event.target.value)} /></div>
                <div className="flex flex-wrap gap-3 border-t border-border pt-5">
                  <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                  <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 flex items-center gap-2 font-serif text-2xl">
                  {p.full_name}{p.verified && <BadgeCheck className="h-5 w-5 text-verified" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[p.professional_title, p.organization].filter(Boolean).join(" · ") || (p.professional_type ? PRO_TYPE_LABEL[p.professional_type] : "LEX member")}
                </p>
                {p.professional_type && <p className="mt-2 text-xs font-medium uppercase text-primary">{PRO_TYPE_LABEL[p.professional_type]}</p>}
                {p.bio && <p className="mt-5 text-sm leading-relaxed">{p.bio}</p>}
                {p.interests.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.interests.map((t) => <span key={t} className="rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">{t}</span>)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
