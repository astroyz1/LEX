import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  professional_type: "student" | "advocate" | "researcher" | "firm" | null;
  organization: string | null;
  professional_title: string | null;
  interests: string[];
  bio: string | null;
  avatar_url: string | null;
  verified: boolean;
  onboarded: boolean;
};

export const PRO_TYPE_LABEL: Record<string, string> = {
  student: "Law Student",
  advocate: "Advocate",
  researcher: "Researcher",
  firm: "Firm",
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return { user: u.user, profile: data as Profile | null };
    },
  });
}

export function initials(name: string) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";
}
