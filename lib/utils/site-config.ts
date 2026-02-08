import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface SiteFeatureFlags {
  showServices: boolean;
  showCourses: boolean;
  showProcess: boolean;
  showTestimonials: boolean;
  showStack: boolean;
  showFinalCta: boolean;
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
  const rows = await prisma.siteConfig.findMany({
    select: { key: true, value: true },
  });

  const get = (key: string) => rows.find((r) => r.key === key)?.value;

  return {
    showServices: coerceBooleanConfig(get("show_services"), false),
    showCourses: coerceBooleanConfig(get("show_courses"), false),
    showProcess: coerceBooleanConfig(get("show_process"), false),
    showTestimonials: coerceBooleanConfig(get("show_testimonials"), false),
    showStack: coerceBooleanConfig(get("show_stack"), false),
    showFinalCta: coerceBooleanConfig(get("show_final_cta"), false),
  };
}
