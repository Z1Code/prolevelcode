import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logTokenUsage, renderSecurePlayerHtml } from "@/lib/tokens/generate";
import { verifyVideoAccess } from "@/lib/tokens/hmac";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/utils/rate-limit";

interface RouteContext {
  params: Promise<{ tokenId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { tokenId } = await context.params;
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  const allowed = await assertRateLimit("/api/video", ipAddress, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // --- HMAC signature verification ---
  const url = new URL(request.url);
  const sig = url.searchParams.get("sig");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 403 });
  }

  const sigPayload = verifyVideoAccess(sig);
  if (!sigPayload) {
    return NextResponse.json({ error: "Invalid or expired signature" }, { status: 403 });
  }

  // --- Token lookup ---
  const token = await prisma.videoToken.findUnique({
    where: { token: tokenId },
    include: {
      lesson: { select: { youtube_video_id: true, title: true } },
      user: { select: { email: true } },
    },
  });

  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  // Verify HMAC payload matches the token
  if (sigPayload.tokenId !== token.id || sigPayload.userId !== token.user_id) {
    return NextResponse.json({ error: "Signature mismatch" }, { status: 403 });
  }

  if (token.is_revoked) {
    await logTokenUsage({ tokenId: token.id, userId: token.user_id, ipAddress, userAgent, action: "rejected", rejectionReason: "revoked" });
    return NextResponse.json({ error: "Token revoked" }, { status: 410 });
  }

  if (token.expires_at < new Date()) {
    await logTokenUsage({ tokenId: token.id, userId: token.user_id, ipAddress, userAgent, action: "expired" });
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  if (token.current_views >= token.max_views) {
    await logTokenUsage({ tokenId: token.id, userId: token.user_id, ipAddress, userAgent, action: "rejected", rejectionReason: "max_views" });
    return NextResponse.json({ error: "Max views reached" }, { status: 410 });
  }

  const allowedIps = token.allowed_ips ?? [];
  const ipSeen = allowedIps.includes(ipAddress);

  if (env.tokenIpMode === "strict" && allowedIps[0] && allowedIps[0] !== ipAddress) {
    await logTokenUsage({ tokenId: token.id, userId: token.user_id, ipAddress, userAgent, action: "rejected", rejectionReason: "ip_mismatch" });
    return NextResponse.json({ error: "IP not allowed" }, { status: 403 });
  }

  if (env.tokenIpMode === "flex" && !ipSeen) {
    if (allowedIps.length >= 3) {
      await logTokenUsage({ tokenId: token.id, userId: token.user_id, ipAddress, userAgent, action: "rejected", rejectionReason: "ip_mismatch" });
      return NextResponse.json({ error: "IP not allowed" }, { status: 403 });
    }

    await prisma.videoToken.update({
      where: { id: token.id },
      data: { allowed_ips: [...allowedIps, ipAddress] },
    });
  }

  // Optimistic concurrency: only update if current_views hasn't changed
  const updated = await prisma.videoToken.updateMany({
    where: { id: token.id, current_views: token.current_views },
    data: { current_views: token.current_views + 1, last_used_at: new Date() },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Token race condition, retry" }, { status: 409 });
  }

  const newCurrentViews = token.current_views + 1;

  if (!token.lesson.youtube_video_id || !token.user.email) {
    return NextResponse.json({ error: "Token relations missing" }, { status: 500 });
  }

  // --- Create/update ActiveVideoSession ---
  await prisma.activeVideoSession.upsert({
    where: { token_id: token.id },
    update: { last_heartbeat: new Date(), ip_address: ipAddress },
    create: {
      user_id: token.user_id,
      token_id: token.id,
      fingerprint: `ip_${ipAddress}`,
      ip_address: ipAddress,
    },
  });

  await logTokenUsage({ tokenId: token.id, userId: token.user_id, ipAddress, userAgent, action: "viewed" });

  const remainingViews = token.max_views - newCurrentViews;

  const html = renderSecurePlayerHtml({
    youtubeId: token.lesson.youtube_video_id,
    userEmail: token.user.email,
    title: token.lesson.title,
    remaining: remainingViews,
    expiresAt: token.expires_at.toISOString(),
    tokenId: token.id,
    heartbeatUrl: "/api/tokens/heartbeat",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Content-Security-Policy": [
        "default-src 'self'",
        "frame-src https://www.youtube-nocookie.com",
        "script-src 'self' 'unsafe-inline' https://www.youtube.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://www.youtube-nocookie.com https://i.ytimg.com",
        "connect-src 'self'",
        "frame-ancestors 'self'",
      ].join("; "),
    },
  });
}
