import { headers } from "next/headers";

export async function getRequestIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "0.0.0.0";
  }

  return h.get("x-real-ip") ?? "0.0.0.0";
}

export async function getRequestUserAgent() {
  const h = await headers();
  return h.get("user-agent") ?? "unknown";
}


