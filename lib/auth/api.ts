import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function requireApiUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { user, supabase };
}

export async function requireApiAdmin() {
  const context = await requireApiUser();

  if (!context) return null;

  const adminClient = createAdminSupabaseClient();
  const { data: appUser } = await adminClient
    .from("users")
    .select("id,role,is_active")
    .eq("id", context.user.id)
    .maybeSingle();

  const role = typeof appUser?.role === "string" ? appUser.role : "student";
  const isActive = Boolean(appUser?.is_active);

  if (!appUser || !isActive || !["admin", "superadmin"].includes(role)) {
    return null;
  }

  return {
    ...context,
    appUser: {
      ...appUser,
      role,
      is_active: isActive,
    },
  };
}
