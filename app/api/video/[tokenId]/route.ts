import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logTokenUsage, renderSecurePlayerHtml } from "@/lib/tokens/generate";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { assertRateLimit } from "@/lib/utils/rate-limit";

interface RouteContext {
  params: Promise<{ tokenId: string }>;
}

interface VideoTokenJoinRow {
  id: string;
  token: string;
  user_id: string;
  expires_at: string;
  max_views: number;
  current_views: number;
  is_revoked: boolean;
  allowed_ips: string[] | null;
  lessons: Array<{ youtube_video_id: string; title: string }> | null;
  users: Array<{ email: string }> | null;
}

export async function GET(request: Request, context: RouteContext) {
  const { tokenId } = await context.params;
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  const allowed = await assertRateLimit("/api/video", ipAddress, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("video_tokens")
    .select("id,token,user_id,expires_at,max_views,current_views,is_revoked,allowed_ips,lessons(youtube_video_id,title),users(email)")
    .eq("token", tokenId)
    .maybeSingle();

  const token = data as VideoTokenJoinRow | null;

  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  const currentViews = Number(token.current_views ?? 0);
  const maxViews = Number(token.max_views ?? 0);

  if (token.is_revoked) {
    await logTokenUsage({ tokenId: token.id, userId: token.user_id, ipAddress, userAgent, action: "rejected", rejectionReason: "revoked" });
    return NextResponse.json({ error: "Token revoked" }, { status: 410 });
  }

  if (new Date(token.expires_at) < new Date()) {
    await logTokenUsage({ tokenId: token.id, userId: token.user_id, ipAddress, userAgent, action: "expired" });
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  if (currentViews >= maxViews) {
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

    await supabase
      .from("video_tokens")
      .update({ allowed_ips: [...allowedIps, ipAddress] })
      .eq("id", token.id);
  }

  const { data: updatedToken } = await supabase
    .from("video_tokens")
    .update({ current_views: currentViews + 1, last_used_at: new Date().toISOString() })
    .eq("id", token.id)
    .eq("current_views", currentViews)
    .select("current_views,max_views")
    .single();

  if (!updatedToken) {
    return NextResponse.json({ error: "Token race condition, retry" }, { status: 409 });
  }

  const lesson = Array.isArray(token.lessons) ? token.lessons[0] : null;
  const user = Array.isArray(token.users) ? token.users[0] : null;

  if (!lesson?.youtube_video_id || !user?.email) {
    return NextResponse.json({ error: "Token relations missing" }, { status: 500 });
  }

  await logTokenUsage({ tokenId: token.id, userId: token.user_id, ipAddress, userAgent, action: "viewed" });

  const remainingViews = Number(updatedToken.max_views ?? 0) - Number(updatedToken.current_views ?? 0);

  const html = renderSecurePlayerHtml({
    youtubeId: lesson.youtube_video_id,
    userEmail: user.email,
    title: lesson.title,
    remaining: remainingViews,
    expiresAt: token.expires_at,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
