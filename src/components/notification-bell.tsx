import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMessageNotifications } from "@/hooks/use-message-notifications";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data, isLoading } = useMessageNotifications();
  const count = data?.count ?? 0;
  const notifications = data?.notifications ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Notifications"
          variant="ghost"
          size="icon"
          className="relative ml-auto shrink-0 rounded-full text-muted-foreground"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-serif text-lg">Notifications</h3>
          {count > 0 && (
            <span className="text-xs text-muted-foreground">{count} unread messages</span>
          )}
        </div>
        <ScrollArea className={cn("max-h-[400px]", notifications.length === 0 && "h-32")}>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center p-4">
              <p className="text-sm text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No new messages.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to="/messages"
                  search={{ active: n.conversation_id }}
                  className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent/60"
                >
                  <UserAvatar
                    name={n.sender?.full_name ?? "User"}
                    url={n.sender?.avatar_url}
                    className="h-9 w-9 shrink-0 text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {n.sender?.full_name ?? "Member"}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {n.body}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" className="w-full justify-center text-xs">
            <Link to="/messages">View all messages</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
