import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";

export type MessageNotification = {
  id: string;
  body: string;
  created_at: string;
  conversation_id: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
};

export function useMessageNotifications() {
  const { data: me } = useMe();
  const uid = me?.user.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["message-notifications", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return { count: 0, notifications: [] as MessageNotification[] };
      // 1. Get conversations I am in with their last_read_at
      const { data: members, error: cErr } = await supabase
        .from("conversation_members")
        .select(`
          conversation_id,
          last_read_at,
          conversation:conversations(
            id,
            is_group,
            title,
            last_message_at
          )
        `)
        .eq("user_id", uid);

      if (cErr) throw cErr;

      // 2. Identify conversations with potential unread messages
      // Filter for conversations where someone else sent a message after we last read
      const potentialConvoIds = (members || [])
        .filter(m => m.conversation && m.conversation.last_message_at > m.last_read_at)
        .map(m => m.conversation_id);

      if (potentialConvoIds.length === 0) return { count: 0, notifications: [] };

      // 3. Fetch the latest message for each potential conversation that wasn't sent by me
      // and is newer than our last_read_at
      const notifications: MessageNotification[] = [];
      
      for (const member of members) {
        if (!potentialConvoIds.includes(member.conversation_id)) continue;

        const { data: msgs } = await supabase
          .from("messages")
          .select(`
            id,
            body,
            created_at,
            conversation_id,
            sender:profiles(id, full_name, avatar_url)
          `)
          .eq("conversation_id", member.conversation_id)
          .gt("created_at", member.last_read_at)
          .neq("sender_id", uid)
          .order("created_at", { ascending: false })
          .limit(1);

        if (msgs?.[0]) {
          notifications.push(msgs[0] as unknown as MessageNotification);
        }
      }

      // Sort notifications by created_at descending
      notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return {
        count: notifications.length,
        notifications,
      };
    }
  });

  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel("global-messages-" + uid)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["message-notifications", uid] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members", filter: `user_id=eq.${uid}` }, () => {
        qc.invalidateQueries({ queryKey: ["message-notifications", uid] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, qc]);

  return query;
}
