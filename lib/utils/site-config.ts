import { unstable_noStore as noStore } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface SiteConfigRow {
  key: string;
  value: unknown;
}

export interface SiteFeatureFlags {
  showServices: boolean;
}

export function coerceBooleanConfig(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

export async function getSiteFeatureFlags(): Promise<SiteFeatureFlags> {
  noStore();
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from("site_config").select("key,value");
  const rows = (data ?? []) as SiteConfigRow[];

  const showServicesRow = rows.find((item) => item.key === "show_services");

  return {
    showServices: coerceBooleanConfig(showServicesRow?.value, true),
  };
}
