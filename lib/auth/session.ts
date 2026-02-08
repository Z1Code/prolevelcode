import { redirect } from "next/navigation";
import type { AppUser, UserRole } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAuth(redirectTo = "/login") {
  const user = await getSessionUser();

  if (!user) {
    redirect(`${redirectTo}?next=${encodeURIComponent("/dashboard")}`);
  }

  return user;
}

export async function getCurrentAppUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: appUser } = await supabase
    .from("users")
    .select("id,email,full_name,avatar_url,role,is_active,created_at,updated_at")
    .eq("id", user.id)
    .single();

  if (!appUser) {
    return null;
  }

  return {
    ...appUser,
    id: String(appUser.id),
    email: String(appUser.email ?? ""),
    full_name: appUser.full_name ? String(appUser.full_name) : null,
    avatar_url: appUser.avatar_url ? String(appUser.avatar_url) : null,
    role: (typeof appUser.role === "string" ? appUser.role : "student") as UserRole,
    is_active: Boolean(appUser.is_active),
    created_at: String(appUser.created_at ?? new Date().toISOString()),
    updated_at: String(appUser.updated_at ?? new Date().toISOString()),
  } satisfies AppUser;
}

export async function requireRole(roles: UserRole[]) {
  const appUser = await getCurrentAppUser();

  if (!appUser || !roles.includes(appUser.role)) {
    redirect("/");
  }

  return appUser;
}
