import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { BadgeCheck, Heart, MessageCircle, Repeat2, HelpCircle, PenLine, Search, LayoutGrid, ImageIcon, Video, X, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { useMe, PRO_TYPE_LABEL } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — LEX" }, { name: "description", content: "Your LEX feed of legal discussions, updates and opportunities." }, { property: "og:title", content: "Home — LEX" }, { property: "og:description", content: "Your LEX feed of legal discussions, updates and opportunities." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: HomePage,
});

type Tab = "foryou" | "following" | "legal_update" | "opportunity";
type Category = "general" | "question" | "legal_update" | "opportunity";
const TABS: [Tab, string][] = [["foryou", "For You"], ["following", "Following"], ["legal_update", "Legal Updates"], ["opportunity", "Opportunities"]];

type FeedPost = {
  id: string; title: string; body: string; tags: string[]; category: Category; created_at: string;
  author: { id: string; full_name: string; verified: boolean; organization: string | null; professional_type: string | null; avatar_url: string | null } | null;
  post_likes: { user_id: string }[]; post_reposts: { user_id: string }[]; post_comments: { count: number }[];
  post_media: { id: string; storage_path: string; media_type: "image" | "video"; mime_type: string; alt_text: string | null; sort_order: number; signed_url: string | null | undefined }[];
};

type SelectedMedia = { file: File; previewUrl: string; type: "image" | "video" };

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function HomePage() {
  const { data: me } = useMe();
  const [tab, setTab] = useState<Tab>("foryou");
  const [compose, setCompose] = useState<Category | null>(null);
  const uid = me?.user.id;
  const first = me?.profile?.full_name?.split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell onCreate={() => setCompose("general")}>
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <section className="grid gap-5 md:grid-cols-[1fr_210px]">
            <div>
              <p className="text-sm text-muted-foreground">{greet}{first ? `, ${first}` : ""}</p>
              <h1 className="mt-2 max-w-xl font-serif text-4xl leading-[1.02] md:text-5xl">Your legal journey,<br />in one place.</h1>
              <p className="mt-3 text-sm text-muted-foreground">Connect. Learn. Collaborate. Grow.</p>
            </div>
            <div className="glass-surface relative hidden min-h-40 overflow-hidden rounded-lg p-6 md:block">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
              <span className="font-serif text-3xl text-muted-foreground">“</span>
              <p className="font-serif text-xl leading-snug">Better lawyers build a brighter India.</p>
              <div className="mt-4 h-px w-8 bg-primary/70" />
            </div>
          </section>

          <div className="mt-6 flex flex-wrap gap-2">
            <QuickAction icon={HelpCircle} label="Ask a Question" onClick={() => setCompose("question")} />
            <QuickAction icon={PenLine} label="Share an Update" onClick={() => setCompose("general")} />
            <QuickAction icon={Search} label="Find Opportunities" onClick={() => setTab("opportunity")} />
            <Link to="/workspaces" className="glass-control flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors hover:bg-accent">
              <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />Create Workspace
            </Link>
          </div>

          <div className="no-scrollbar mt-7 flex gap-6 overflow-x-auto border-b border-border">
            {TABS.map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={cn("-mb-px whitespace-nowrap border-b-2 pb-3 text-sm transition-colors",
                  tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>

          {uid && <Feed tab={tab} uid={uid} onCompose={() => setCompose(tab === "legal_update" || tab === "opportunity" ? tab : "general")} />}
        </div>

        <aside className="hidden space-y-6 xl:block">
          {uid && <SuggestedPeople uid={uid} />}
          <div className="glass-surface rounded-lg p-5">
            <h3 className="text-sm font-medium">Founding community</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You're among the first members of LEX. Share what you're working on and help shape the platform.
            </p>
          </div>
        </aside>
      </div>
      {uid && <Composer open={compose} onClose={() => setCompose(null)} uid={uid} />}
    </AppShell>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof HelpCircle; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="glass-control rounded-md px-3 text-xs font-normal">
      <Icon className="h-4 w-4" strokeWidth={1.5} />{label}
    </Button>
  );
}

function Feed({ tab, uid, onCompose }: { tab: Tab; uid: string; onCompose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["feed", tab],
    queryFn: async () => {
      let q = supabase
        .from("posts")
        .select("id,title,body,tags,category,created_at,author:profiles!posts_author_id_fkey(id,full_name,verified,organization,professional_type,avatar_url),post_likes(user_id),post_reposts(user_id),post_comments(count),post_media(id,storage_path,media_type,mime_type,alt_text,sort_order)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (tab === "legal_update" || tab === "opportunity") q = q.eq("category", tab);
      if (tab === "following") {
        const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", uid);
        const ids = (f ?? []).map((r) => r.following_id);
        if (!ids.length) return [];
        q = q.in("author_id", ids);
      }
      const { data, error } = await q;
      if (error) throw error;
      const posts = (data as unknown as FeedPost[]).map((post) => ({
        ...post,
        tags: post.tags ?? [],
        post_likes: post.post_likes ?? [],
        post_reposts: post.post_reposts ?? [],
        post_comments: post.post_comments ?? [],
        post_media: (post.post_media ?? []).sort((a, b) => a.sort_order - b.sort_order),
      }));
      const paths = posts.flatMap((post) => post.post_media.map((media) => media.storage_path));
      if (paths.length) {
        const { data: urls, error: urlError } = await supabase.storage.from("post-media").createSignedUrls(paths, 60 * 60);
        if (urlError) throw urlError;
        const urlByPath = new Map((urls ?? []).map((item) => [item.path, item.signedUrl]));
        posts.forEach((post) => {
          post.post_media = post.post_media.map((media) => ({ ...media, signed_url: urlByPath.get(media.storage_path) }));
        });
      }
      return posts;
    },
  });

  if (isLoading) return <div className="mt-4 space-y-3">{[0, 1].map((i) => <div key={i} className="glass-surface h-40 animate-pulse rounded-lg" />)}</div>;
  if (!data?.length)
    return (
      <div className="glass-surface mt-4 rounded-lg border-dashed p-10 text-center">
        <p className="font-serif text-2xl">{tab === "following" ? "Follow people to see their posts here." : "Nothing here yet."}</p>
        <p className="mt-2 text-sm text-muted-foreground">Be one of the first voices in the founding community.</p>
        <Button className="mt-6" onClick={onCompose}>Write a post</Button>
      </div>
    );
  return <div className="mt-4 space-y-3">{data.map((p) => <PostCard key={p.id} post={p} uid={uid} />)}</div>;
}

function PostCard({ post, uid }: { post: FeedPost; uid: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const likes = post.post_likes ?? [];
  const reposts = post.post_reposts ?? [];
  const comments = post.post_comments ?? [];
  const media = post.post_media ?? [];
  const tags = post.tags ?? [];
  const liked = likes.some((l) => l.user_id === uid);
  const reposted = reposts.some((l) => l.user_id === uid);
  const refresh = () => qc.invalidateQueries({ queryKey: ["feed"] });

  const toggle = useMutation({
    mutationFn: async (kind: "post_likes" | "post_reposts") => {
      const on = kind === "post_likes" ? liked : reposted;
      const { error } = on
        ? await supabase.from(kind).delete().eq("post_id", post.id).eq("user_id", uid)
        : await supabase.from(kind).insert({ post_id: post.id, user_id: uid });
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const a = post.author;
  const meta = [a?.organization || (a?.professional_type && PRO_TYPE_LABEL[a.professional_type])].filter(Boolean);
  return (
    <article className="glass-surface rounded-lg p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <UserAvatar name={a?.full_name ?? ""} url={a?.avatar_url} />
        <div>
          <div className="flex items-center gap-1.5 font-medium">
            {a?.full_name || "Member"}
            {a?.verified && <BadgeCheck className="h-4 w-4 text-verified" aria-label="Verified professional" />}
          </div>
          <div className="text-xs text-muted-foreground">{[timeAgo(post.created_at), ...meta].join(" · ")}</div>
        </div>
        {post.category !== "general" && (
          <span className="ml-auto rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
            {{ question: "Question", legal_update: "Legal Update", opportunity: "Opportunity" }[post.category]}
          </span>
        )}
      </div>
      <h2 className="mt-4 font-serif text-lg leading-snug">{post.title}</h2>
      {post.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{post.body}</p>}
      {media.length > 0 && <PostMedia media={media} title={post.title} />}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => <span key={t} className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">{t}</span>)}
        </div>
      )}
      <div className="mt-5 flex items-center gap-6 text-sm text-muted-foreground">
        <button onClick={() => toggle.mutate("post_likes")} className={cn("flex items-center gap-1.5 hover:text-foreground", liked && "text-heart")}>
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />{likes.length}
        </button>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 hover:text-foreground">
          <MessageCircle className="h-4 w-4" />{comments[0]?.count ?? 0}
        </button>
        <button onClick={() => toggle.mutate("post_reposts")} className={cn("flex items-center gap-1.5 hover:text-foreground", reposted && "text-primary")}>
          <Repeat2 className="h-4 w-4" />{reposts.length}
        </button>
      </div>
      {open && <Comments postId={post.id} uid={uid} />}
    </article>
  );
}

function PostMedia({ media, title }: { media: FeedPost["post_media"]; title: string }) {
  const available = media.filter((item) => item.signed_url);
  if (!available.length) return null;
  if (available[0]?.media_type === "video") {
    return (
      <video
        className="mt-4 max-h-[560px] w-full rounded-lg border border-border bg-background object-contain"
        src={available[0].signed_url ?? undefined}
        controls
        playsInline
        preload="metadata"
      >
        Your browser does not support video playback.
      </video>
    );
  }
  return (
    <div className={cn("mt-4 grid gap-1.5 overflow-hidden rounded-lg", available.length > 1 && "grid-cols-2")}>
      {available.map((item, index) => (
        <img
          key={item.id}
          src={item.signed_url ?? undefined}
          alt={item.alt_text || `${title} — image ${index + 1}`}
          loading="lazy"
          className={cn("w-full bg-background object-cover", available.length === 1 ? "max-h-[640px] object-contain" : "aspect-square", available.length === 3 && index === 0 && "row-span-2 h-full")}
        />
      ))}
    </div>
  );
}

function Comments({ postId, uid }: { postId: string; uid: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const { data } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase.from("post_comments")
        .select("id,body,created_at,author:profiles!post_comments_author_id_fkey(full_name,verified)")
        .eq("post_id", postId).order("created_at");
      if (error) throw error;
      return data as unknown as { id: string; body: string; created_at: string; author: { full_name: string; verified: boolean } | null }[];
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const body = z.string().trim().min(1).max(2000).parse(text);
      const { error } = await supabase.from("post_comments").insert({ post_id: postId, author_id: uid, body });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["comments", postId] }); qc.invalidateQueries({ queryKey: ["feed"] }); },
    onError: () => toast.error("Couldn't post comment"),
  });
  return (
    <div className="mt-5 space-y-3 border-t border-border pt-4">
      {data?.map((c) => (
        <div key={c.id} className="text-sm">
          <span className="font-medium">{c.author?.full_name || "Member"}</span>
          <span className="ml-2 text-muted-foreground">{c.body}</span>
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" maxLength={2000} />
        <Button type="submit" size="sm" disabled={!text.trim() || add.isPending}>Post</Button>
      </form>
    </div>
  );
}

const postSchema = z.object({
  title: z.string().trim().min(1, "Add a title").max(200),
  body: z.string().trim().max(5000),
  tags: z.array(z.string().trim().min(1).max(40)).max(6),
});

function Composer({ open, onClose, uid }: { open: Category | null; onClose: () => void; uid: string }) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [cat, setCat] = useState<Category>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [media, setMedia] = useState<SelectedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lastOpen, setLastOpen] = useState<Category | null>(null);
  if (open !== lastOpen) { setLastOpen(open); if (open) setCat(open); }

  useEffect(() => () => media.forEach((item) => URL.revokeObjectURL(item.previewUrl)), [media]);

  const chooseMedia = (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const hasVideo = selected.some((file) => VIDEO_TYPES.has(file.type));
    const hasImage = selected.some((file) => IMAGE_TYPES.has(file.type));
    if (hasVideo && hasImage) { toast.error("Choose either images or one video"); return; }
    if (hasVideo && (selected.length > 1 || media.length > 0)) { toast.error("A post can include one video"); return; }
    if (hasImage && (media.some((item) => item.type === "video") || media.length + selected.length > 4)) { toast.error("A post can include up to four images"); return; }
    for (const file of selected) {
      if (!IMAGE_TYPES.has(file.type) && !VIDEO_TYPES.has(file.type)) { toast.error("Choose JPG, PNG, WebP, GIF, MP4, WebM, or MOV files"); return; }
      if (IMAGE_TYPES.has(file.type) && file.size > MAX_IMAGE_SIZE) { toast.error(`${file.name} is larger than 10 MB`); return; }
      if (VIDEO_TYPES.has(file.type) && file.size > MAX_VIDEO_SIZE) { toast.error(`${file.name} is larger than 50 MB`); return; }
    }
    setMedia((current) => [...current, ...selected.map((file) => ({ file, previewUrl: URL.createObjectURL(file), type: VIDEO_TYPES.has(file.type) ? "video" as const : "image" as const }))]);
    if (fileInput.current) fileInput.current.value = "";
  };

  const removeMedia = (index: number) => {
    setMedia((current) => {
      const item = current[index];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const reset = () => {
    media.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setTitle("");
    setBody("");
    setTags("");
    setMedia([]);
  };

  const submit = useMutation({
    mutationFn: async () => {
      const p = postSchema.parse({ title, body, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) });
      setUploading(media.length > 0);
      const uploadedPaths: string[] = [];
      let postId: string | null = null;
      try {
        for (const [index, item] of media.entries()) {
          const extension = item.file.name.split(".").pop()?.toLowerCase() || (item.type === "video" ? "mp4" : "jpg");
          const path = `${uid}/${crypto.randomUUID()}-${index}.${extension}`;
          const { error } = await supabase.storage.from("post-media").upload(path, item.file, { contentType: item.file.type, upsert: false });
          if (error) throw error;
          uploadedPaths.push(path);
        }
        const { data: post, error: postError } = await supabase.from("posts").insert({ ...p, category: cat, author_id: uid }).select("id").single();
        if (postError) throw postError;
        postId = post.id;
        if (media.length) {
          const mediaRows = media.map((item, index) => {
            const storagePath = uploadedPaths[index];
            if (!storagePath) throw new Error("A media upload did not complete");
            return {
              post_id: post.id,
              uploader_id: uid,
              storage_path: storagePath,
              media_type: item.type,
              mime_type: item.file.type,
              alt_text: item.type === "image" ? title.trim() : null,
              sort_order: index,
            };
          });
          const { error: mediaError } = await supabase.from("post_media").insert(mediaRows);
          if (mediaError) throw mediaError;
        }
      } catch (error) {
        if (postId) await supabase.from("posts").delete().eq("id", postId);
        if (uploadedPaths.length) await supabase.storage.from("post-media").remove(uploadedPaths);
        throw error;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => { reset(); onClose(); qc.invalidateQueries({ queryKey: ["feed"] }); toast.success("Posted"); },
    onError: (e: Error) => toast.error(e instanceof z.ZodError ? e.issues[0]?.message ?? "Check your post" : e.message),
  });

  const cats: [Category, string][] = [["general", "Update"], ["question", "Question"], ["legal_update", "Legal Update"], ["opportunity", "Opportunity"]];
  return (
    <Dialog open={!!open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-serif text-2xl font-normal">{cat === "question" ? "Ask a question" : "Share with the community"}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-2">
          {cats.map(([k, l]) => (
            <button key={k} onClick={() => setCat(k)} className={cn("rounded-md border px-3 py-1.5 text-xs", cat === k ? "border-primary text-foreground" : "border-border text-muted-foreground")}>{l}</button>
          ))}
        </div>
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        <Textarea placeholder="Write your thoughts…" rows={6} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} />
        {media.length > 0 && (
          <div className={cn("grid gap-2", media.length > 1 && "grid-cols-2")}>
            {media.map((item, index) => (
              <div key={item.previewUrl} className="relative overflow-hidden rounded-lg border border-border bg-background">
                {item.type === "image" ? (
                  <img src={item.previewUrl} alt="Selected post media" className="aspect-video h-full w-full object-cover" />
                ) : (
                  <video src={item.previewUrl} className="aspect-video h-full w-full object-contain" controls playsInline />
                )}
                <Button type="button" variant="secondary" size="icon" className="absolute right-2 top-2 h-8 w-8" onClick={() => removeMedia(index)} aria-label={`Remove ${item.type}`}>
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple className="hidden" onChange={(event) => chooseMedia(event.target.files)} />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={media.some((item) => item.type === "video") || media.length >= 4}>
            <ImageIcon /> Add images
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={media.length > 0}>
            <Video /> Add video
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">{media.some((item) => item.type === "video") ? "1 video" : `${media.length}/4 images`}</span>
        </div>
        <Input placeholder="Topics, comma separated (e.g. Arbitration, Data Privacy)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submit.isPending}>Cancel</Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>{uploading && <LoaderCircle className="animate-spin" />}{uploading ? "Uploading" : "Post"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SuggestedPeople({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["suggested", uid],
    queryFn: async () => {
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", uid);
      const followed = new Set((f ?? []).map((r) => r.following_id));
      const { data } = await supabase.from("profiles").select("id,full_name,verified,organization,professional_type,avatar_url")
        .eq("onboarded", true).neq("id", uid).order("created_at", { ascending: false }).limit(20);
      return (data ?? []).filter((p) => !followed.has(p.id)).slice(0, 5);
    },
  });
  const follow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("follows").insert({ follower_id: uid, following_id: id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suggested"] }); qc.invalidateQueries({ queryKey: ["feed", "following"] }); },
  });
  return (
    <div className="glass-surface rounded-lg p-5">
      <h3 className="text-sm font-medium">Suggested people</h3>
      {!data?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">As more founding members join, you'll see them here.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {data.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <UserAvatar name={p.full_name} url={p.avatar_url} className="h-9 w-9 text-xs" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate text-sm">{p.full_name}{p.verified && <BadgeCheck className="h-3.5 w-3.5 text-verified" />}</div>
                <div className="truncate text-xs text-muted-foreground">{p.organization || (p.professional_type && PRO_TYPE_LABEL[p.professional_type])}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => follow.mutate(p.id)}>Follow</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
