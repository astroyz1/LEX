import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { initials } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, url, className }: { name: string; url?: string | null | undefined; className?: string | undefined }) {
  return (
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-medium", className)}>
      {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

export function AvatarUpload({ uid, name, url }: { uid: string; name: string; url?: string | null | undefined }) {
  const ref = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Use a JPG, PNG or WebP image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setBusy(true);
    const path = `${uid}/avatar-${Date.now()}.${file.type.split("/")[1]}`;
    const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (up.error) { setBusy(false); toast.error(up.error.message); return; }
    const signed = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (signed.error) { setBusy(false); toast.error(signed.error.message); return; }
    const { error } = await supabase.from("profiles").update({ avatar_url: signed.data.signedUrl }).eq("id", uid);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile picture updated");
    qc.invalidateQueries();
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar name={name} url={url} className="h-20 w-20 text-xl" />
      <div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          <Camera className="h-4 w-4" strokeWidth={1.5} />{busy ? "Uploading…" : url ? "Change photo" : "Upload photo"}
        </button>
        <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB.</p>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}
