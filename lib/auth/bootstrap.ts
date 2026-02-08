import { env } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function bootstrapAdminRoleByEmail(user: { id: string; email?: string | null }) {
  const email = user.email?.toLowerCase().trim();
  if (!email || !env.adminEmails.includes(email)) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  await supabase.from("users").update({ role: "superadmin" }).eq("id", user.id);
}


