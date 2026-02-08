import { NextResponse } from "next/server";
import { revokeTokenSchema } from "@/lib/validators/api";
import { requireApiAdmin } from "@/lib/auth/api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logTokenUsage } from "@/lib/tokens/generate";

export async function POST(request: Request) {
  const context = await requireApiAdmin();
  if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = revokeTokenSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: token } = await supabase
    .from("video_tokens")
    .update({ is_revoked: true, revoked_at: new Date().toISOString(), revoked_reason: parsed.data.reason })
    .eq("id", parsed.data.tokenId)
    .select("id,user_id")
    .maybeSingle();

  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  await logTokenUsage({
    tokenId: String(token.id),
    userId: token.user_id ? String(token.user_id) : null,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0",
    userAgent: request.headers.get("user-agent") ?? "unknown",
    action: "revoked",
    metadata: {
      reason: parsed.data.reason,
      revokedBy: context.user.id,
    },
  });

  await supabase.from("admin_audit_logs").insert({
    admin_user_id: context.user.id,
    action: "token.revoke",
    target_table: "video_tokens",
    target_id: parsed.data.tokenId,
    metadata: { reason: parsed.data.reason },
  });

  return NextResponse.json({ ok: true });
}
