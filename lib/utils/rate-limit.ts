import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function assertRateLimit(route: string, actorKey: string, maxHits: number, windowSeconds: number) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_route: route,
    p_actor_key: actorKey,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limit RPC error", error);
    return true;
  }

  return Boolean(data);
}


