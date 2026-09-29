import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(100, "Name is too long"),
  professionalTitle: z.string().trim().max(100, "Professional title is too long"),
  organization: z.string().trim().max(150, "Organization is too long"),
  bio: z.string().trim().max(500, "Bio is too long"),
  interests: z.array(z.string().trim().min(1).max(40)).max(10, "Add up to 10 interests"),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => profileUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        professional_title: data.professionalTitle || null,
        organization: data.organization || null,
        bio: data.bio || null,
        interests: data.interests,
      })
      .eq("id", context.userId);

    if (error) throw new Error("Your profile could not be saved. Please try again.");
    return { ok: true };
  });