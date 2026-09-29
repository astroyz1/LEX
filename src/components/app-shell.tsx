import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Users, Briefcase, LayoutGrid, BookMarked, MessageSquare, User, Plus, Search, LogOut, UserRoundCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { UserAvatar } from "@/components/user-avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./notification-bell";

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/network", label: "Network", icon: Users },
  { to: "/opportunities", label: "Opportunities", icon: Briefcase },
  { to: "/workspaces", label: "Workspaces", icon: LayoutGrid },
  { to: "/library", label: "Library", icon: BookMarked },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children, onCreate }: { children: ReactNode; onCreate?: () => void }) {
  const { data: me, isLoading } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isLoading && me && !me.profile?.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [me, isLoading, navigate]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const name = me?.profile?.full_name ?? "";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-background/48 px-4 py-6 backdrop-blur-2xl lg:flex">
        <Link to="/home" className="px-3 font-serif text-3xl">LEX</Link>
        <nav className="mt-9 space-y-1.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-all hover:border-border hover:bg-accent hover:text-foreground"
              activeProps={{ className: "glass-control text-foreground" }}
            >
              <n.icon className="h-4 w-4" strokeWidth={1.5} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Button
            variant="outline"
            onClick={onCreate}
            className="glass-control w-full"
          >
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/58 px-4 py-3 backdrop-blur-2xl md:gap-4 md:px-7">
          <Link to="/home" className="shrink-0 font-serif text-2xl lg:hidden">LEX</Link>
          <div className="glass-control flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground md:max-w-xl">
            <Search className="h-4 w-4 shrink-0" />
            <input className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground" placeholder="Search…" />
          </div>
          
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Account menu" variant="ghost" size="icon" className="shrink-0 rounded-full p-0">
                <UserAvatar name={name} url={me?.profile?.avatar_url} className="h-9 w-9 text-xs" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="truncate font-normal">
                <span className="block text-xs text-muted-foreground">Signed in as</span>
                <span className="mt-0.5 block truncate font-medium text-foreground">{name || me?.user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/library">Library</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 px-4 pb-28 pt-5 md:px-7 md:pt-6 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/74 pb-[env(safe-area-inset-bottom)] shadow-[0_-16px_40px_oklch(0.04_0.02_250/35%)] backdrop-blur-2xl lg:hidden">
        {NAV.filter((n) => n.to !== "/library" && n.to !== "/profile").map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex min-w-0 flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            <span className="w-full truncate text-center">{n.label === "Opportunities" ? "Jobs" : n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function ComingSoon({ title, line }: { title: string; line: string }) {
  return (
    <AppShell>
      <h1 className="font-serif text-4xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{line}</p>
      <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        This area is being built next.
      </div>
    </AppShell>
  );
}
