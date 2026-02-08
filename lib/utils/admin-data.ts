import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface AdminLatestSale {
  id: string;
  amount_paid_cents: number | null;
  currency: string | null;
  enrolled_at: string;
  users: Array<{ email: string | null }>;
  courses: Array<{ title: string | null }>;
}

export interface AdminLatestToken {
  id: string;
  token: string;
  current_views: number;
  max_views: number;
  expires_at: string;
  users: Array<{ email: string | null }>;
  lessons: Array<{ title: string | null }>;
}

export interface AdminMetricsData {
  monthlyRevenueCents: number;
  newUsers: number;
  activeCourses: number;
  activeTokens: number;
  latestSales: AdminLatestSale[];
  latestTokens: AdminLatestToken[];
}

export async function getAdminMetrics(): Promise<AdminMetricsData> {
  const supabase = createAdminSupabaseClient();

  const [revenueMonth, newUsers, activeCourses, activeTokens, latestSales, latestTokens] = await Promise.all([
    supabase
      .from("enrollments")
      .select("amount_paid_cents,enrolled_at")
      .gte("enrolled_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase
      .from("video_tokens")
      .select("id", { count: "exact", head: true })
      .eq("is_revoked", false)
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("enrollments")
      .select("id,amount_paid_cents,currency,enrolled_at,users(email),courses(title)")
      .order("enrolled_at", { ascending: false })
      .limit(8),
    supabase
      .from("video_tokens")
      .select("id,token,current_views,max_views,expires_at,users(email),lessons(title)")
      .eq("is_revoked", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    monthlyRevenueCents: (revenueMonth.data ?? []).reduce((acc, item) => acc + Number(item.amount_paid_cents ?? 0), 0),
    newUsers: newUsers.count ?? 0,
    activeCourses: activeCourses.count ?? 0,
    activeTokens: activeTokens.count ?? 0,
    latestSales: ((latestSales.data ?? []) as unknown) as AdminLatestSale[],
    latestTokens: ((latestTokens.data ?? []) as unknown) as AdminLatestToken[],
  };
}
