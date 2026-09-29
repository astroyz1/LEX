import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileText, Paperclip, Plus, Send, Users, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { useMe, PRO_TYPE_LABEL } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MessagesSearch = {
  active?: string;
};

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (search: Record<string, unknown>): MessagesSearch => {
    return typeof search["active"] === "string" ? { active: search["active"] } : {};
  },
  head: () => ({ meta: [
    { title: "Messages — LEX" },
    { name: "description", content: "Direct messages and group threads on LEX." },
    { property: "og:title", content: "Messages — LEX" },
    { property: "og:description", content: "Direct messages and group threads on LEX." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: MessagesPage,
});

type Person = { id: string; full_name: string; avatar_url: string | null; organization: string | null; professional_type: string | null; verified: boolean };
type Convo = {
  id: string; is_group: boolean; title: string | null; last_message_at: string;
  members: { user_id: string; last_read_at: string; profile: Person | null }[];
  last?: Msg | undefined; unread: number;
};
type Msg = { id: string; conversation_id: string; sender_id: string; body: string; attachment_path: string | null; attachment_name: string | null; attachment_size: number | null; created_at: string };

const PERSON = "id,full_name,avatar_url,organization,professional_type,verified";

function fmtTime(d: string) {
  const dt = new Date(d); const now = new Date();
  if (dt.toDateString() === now.toDateString()) return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function fmtSize(n: number | null) { if (!n) return ""; return n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`; }

function convoName(c: Convo, uid: string) {
  const others = c.members.filter((m) => m.user_id !== uid);
  if (c.is_group) return c.title || others.map((m) => m.profile?.full_name.split(" ")[0]).join(", ") || "Group";
  return others[0]?.profile?.full_name || "Member";
}

function MessagesPage() {
  const { data: me } = useMe();
  const uid = me?.user.id;
  const qc = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const { active } = Route.useSearch();
  const setActive = (id: string | null) => navigate({ search: id ? { active: id } : {} });
  
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all");
  const [newOpen, setNewOpen] = useState(false);

  const { data: convos = [], isLoading } = useQuery({
    queryKey: ["convos", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations")
        .select(`id,is_group,title,last_message_at,members:conversation_members(user_id,last_read_at,profile:profiles(${PERSON}))`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const list = data as unknown as Convo[];
      if (!list.length) return [];
      const { data: msgs } = await supabase.from("messages").select("*")
        .in("conversation_id", list.map((c) => c.id)).order("created_at", { ascending: false }).limit(1000);
      return list.map((c) => {
        const mine = c.members.find((m) => m.user_id === uid);
        const cm = (msgs ?? []).filter((m) => m.conversation_id === c.id) as Msg[];
        return { ...c, last: cm[0], unread: cm.filter((m) => m.sender_id !== uid && mine && m.created_at > mine.last_read_at).length };
      });
    },
  });

  useEffect(() => {
    if (!uid) return;
    const ch = supabase.channel("inbox-" + uid)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        const m = p.new as Msg;
        qc.invalidateQueries({ queryKey: ["convos", uid] });
        qc.invalidateQueries({ queryKey: ["msgs", m.conversation_id] });
        qc.invalidateQueries({ queryKey: ["message-notifications", uid] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, qc]);

  const shown = convos.filter((c) => filter === "all" || (filter === "unread" ? c.unread > 0 : c.is_group));
  const current = convos.find((c) => c.id === active);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className={cn("mb-6 flex items-center justify-between gap-4", active && "hidden md:flex")}>
          <h1 className="font-serif text-4xl">Messages</h1>
          <Button onClick={() => setNewOpen(true)}><Plus className="mr-1 h-4 w-4" />New message</Button>
        </div>
        <div className="grid h-[calc(100dvh-15rem)] min-h-[420px] overflow-hidden rounded-2xl border border-border bg-card md:h-[calc(100dvh-13rem)] md:grid-cols-[320px_1fr]">
          <div className={cn("flex min-h-0 flex-col border-r border-border", active && "hidden md:flex")}>
            <div className="flex gap-2 border-b border-border p-3">
              {(["all", "unread", "groups"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn("rounded-md px-3 py-1.5 text-xs capitalize", filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {f}
                </button>
              ))}
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto">
              {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p>
                : !shown.length ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {convos.length ? "Nothing here." : "No conversations yet. Start one with a colleague."}
                  </div>
                ) : shown.map((c) => {
                  const other = c.members.find((m) => m.user_id !== uid)?.profile;
                  return (
                    <button key={c.id} onClick={() => setActive(c.id)}
                      className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60", active === c.id && "bg-accent")}>
                      {c.is_group
                        ? <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"><Users className="h-4 w-4" strokeWidth={1.5} /></div>
                        : <UserAvatar name={other?.full_name ?? ""} url={other?.avatar_url} />}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{uid && convoName(c, uid)}</span>
                          {c.last && <span className="shrink-0 text-[11px] text-muted-foreground">{fmtTime(c.last.created_at)}</span>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted-foreground">
                            {c.last ? `${c.last.sender_id === uid ? "You: " : ""}${c.last.body || (c.last.attachment_name ? "Sent a file" : "")}` : "No messages yet"}
                          </span>
                          {c.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{c.unread}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
          <div className={cn("min-h-0", !active && "hidden md:block")}>
            {current && uid ? <ChatPane key={current.id} convo={current} uid={uid} onBack={() => setActive(null)} />
              : <div className="flex h-full items-center justify-center p-8 text-center">
                  <div>
                    <p className="font-serif text-2xl">Your conversations</p>
                    <p className="mt-2 text-sm text-muted-foreground">Select a thread or start a new one.</p>
                  </div>
                </div>}
          </div>
        </div>
      </div>
      {uid && <NewMessage open={newOpen} onClose={() => setNewOpen(false)} uid={uid}
        onCreated={(id) => { setNewOpen(false); qc.invalidateQueries({ queryKey: ["convos", uid] }).then(() => setActive(id)); }} />}
    </AppShell>
  );
}

function ChatPane({ convo, uid, onBack }: { convo: Convo; uid: string; onBack: () => void }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const people = useMemo(() => Object.fromEntries(convo.members.map((m) => [m.user_id, m.profile])), [convo]);
  const other = convo.members.find((m) => m.user_id !== uid)?.profile;

  const { data: msgs = [] } = useQuery({
    queryKey: ["msgs", convo.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", convo.id).order("created_at").limit(500);
      if (error) throw error;
      return data as Msg[];
    },
  });

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);
  useEffect(() => {
    supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", convo.id).eq("user_id", uid)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["convos", uid] });
        qc.invalidateQueries({ queryKey: ["message-notifications", uid] });
      });
  }, [convo.id, uid, msgs.length, qc]);

  const send = useMutation({
    mutationFn: async () => {
      const body = text.trim().slice(0, 5000);
      if (!body && !file) return;
      let att: Partial<Msg> = {};
      if (file) {
        if (file.size > 20 * 1024 * 1024) throw new Error("Files must be under 20 MB");
        const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-100);
        const path = `${convo.id}/${uid}/${Date.now()}-${safe}`;
        const up = await supabase.storage.from("message-files").upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (up.error) throw up.error;
        att = { attachment_path: path, attachment_name: file.name.slice(0, 200), attachment_size: file.size };
      }
      const { error } = await supabase.from("messages").insert({ conversation_id: convo.id, sender_id: uid, body, ...att });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); setFile(null); qc.invalidateQueries({ queryKey: ["msgs", convo.id] }); qc.invalidateQueries({ queryKey: ["convos", uid] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openFile(path: string) {
    const { data, error } = await supabase.storage.from("message-files").createSignedUrl(path, 300);
    if (error) { toast.error("Couldn't open file"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const subtitle = convo.is_group
    ? `${convo.members.length} members`
    : [other?.organization, other?.professional_type && PRO_TYPE_LABEL[other.professional_type]].filter(Boolean)[0] ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onBack} className="shrink-0 text-muted-foreground md:hidden" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
        {convo.is_group
          ? <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary"><Users className="h-4 w-4" strokeWidth={1.5} /></div>
          : <UserAvatar name={other?.full_name ?? ""} url={other?.avatar_url} className="h-9 w-9 text-xs" />}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{convoName(convo, uid)}</div>
          {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {!msgs.length && <p className="text-center text-sm text-muted-foreground">Say hello to start the conversation.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === uid;
          const who = people[m.sender_id];
          return (
            <div key={m.id} className={cn("flex items-end gap-2", mine && "justify-end")}>
              {!mine && <UserAvatar name={who?.full_name ?? ""} url={who?.avatar_url} className="h-7 w-7 text-[10px]" />}
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm", mine ? "bg-primary/20" : "bg-secondary")}>
                {convo.is_group && !mine && <div className="mb-0.5 text-xs text-muted-foreground">{who?.full_name}</div>}
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {m.attachment_path && (
                  <button onClick={() => openFile(m.attachment_path!)} className="mt-1.5 flex w-full items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-left">
                    <FileText className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs">{m.attachment_name}</span>
                      <span className="block text-[11px] text-muted-foreground">{fmtSize(m.attachment_size)}</span>
                    </span>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                )}
                <div className="mt-1 text-right text-[10px] text-muted-foreground">{fmtTime(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="border-t border-border p-3">
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs">
            <FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove file"><X className="h-4 w-4" /></button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Attach file">
            <Paperclip className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" maxLength={5000} />
          <Button type="submit" size="icon" className="shrink-0" disabled={send.isPending || (!text.trim() && !file)} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function NewMessage({ open, onClose, uid, onCreated }: { open: boolean; onClose: () => void; uid: string; onCreated: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Person[]>([]);
  const [title, setTitle] = useState("");
  const { data: people = [] } = useQuery({
    queryKey: ["people-search", q],
    enabled: open,
    queryFn: async () => {
      let r = supabase.from("profiles").select(PERSON).eq("onboarded", true).neq("id", uid).order("full_name").limit(20);
      const term = q.trim().replace(/[%,()]/g, "");
      if (term) r = r.ilike("full_name", `%${term}%`);
      const { data } = await r;
      return (data ?? []) as Person[];
    },
  });
  const start = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("start_conversation", { _member_ids: picked.map((p) => p.id), ...(title ? { _title: title } : {}) });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (id) => { setPicked([]); setTitle(""); setQ(""); onCreated(id); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = (p: Person) => setPicked((s) => s.some((x) => x.id === p.id) ? s.filter((x) => x.id !== p.id) : [...s, p]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-serif text-2xl font-normal">New message</DialogTitle></DialogHeader>
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {picked.map((p) => (
              <button key={p.id} onClick={() => toggle(p)} className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs">
                {p.full_name}<X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
        <Input placeholder="Search people by name" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {!people.length && <p className="py-4 text-center text-sm text-muted-foreground">No members found.</p>}
          {people.map((p) => {
            const on = picked.some((x) => x.id === p.id);
            return (
              <button key={p.id} onClick={() => toggle(p)} className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-accent", on && "bg-accent")}>
                <UserAvatar name={p.full_name} url={p.avatar_url} className="h-8 w-8 text-xs" />
                <div className="min-w-0">
                  <div className="truncate text-sm">{p.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.organization || (p.professional_type && PRO_TYPE_LABEL[p.professional_type])}</div>
                </div>
              </button>
            );
          })}
        </div>
        {picked.length > 1 && <Input placeholder="Group name (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!picked.length || start.isPending} onClick={() => start.mutate()}>Start</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
