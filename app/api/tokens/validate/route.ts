import { NextResponse } from "next/server";
import { validateTokenSchema } from "@/lib/validators/api";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const context = await requireApiUser();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const parsed = validateTokenSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const token = await prisma.videoToken.findFirst({
    where: { token: parsed.data.token, user_id: context.user.id },
  });

  if (!token) return NextResponse.json({ error: "Token not found" }, { status: 404 });

  if (token.is_revoked) return NextResponse.json({ error: "Token revoked" }, { status: 410 });
  if (token.expires_at < new Date()) return NextResponse.json({ error: "Token expired" }, { status: 410 });
  if (token.current_views >= token.max_views) return NextResponse.json({ error: "Max views reached" }, { status: 410 });

  return NextResponse.json({
    valid: true,
    token: token.token,
    remainingViews: token.max_views - token.current_views,
    expiresAt: token.expires_at.toISOString(),
  });
}
