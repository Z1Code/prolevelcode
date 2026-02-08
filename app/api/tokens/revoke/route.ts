import { NextResponse } from "next/server";
import { revokeTokenSchema } from "@/lib/validators/api";
import { requireApiAdmin } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { logTokenUsage } from "@/lib/tokens/generate";

export async function POST(request: Request) {
  const context = await requireApiAdmin();
  if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = revokeTokenSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const token = await prisma.videoToken.update({
    where: { id: parsed.data.tokenId },
    data: { is_revoked: true, revoked_at: new Date(), revoked_reason: parsed.data.reason },
  });

  await logTokenUsage({
    tokenId: token.id,
    userId: token.user_id,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0",
    userAgent: request.headers.get("user-agent") ?? "unknown",
    action: "revoked",
    metadata: {
      reason: parsed.data.reason,
      revokedBy: context.user.id,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      admin_user_id: context.user.id,
      action: "token.revoke",
      target_table: "video_tokens",
      target_id: parsed.data.tokenId,
      metadata: { reason: parsed.data.reason },
    },
  });

  return NextResponse.json({ ok: true });
}
