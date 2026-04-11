import { NextResponse } from "next/server";
import { renderSecurePlayerHtml } from "@/lib/tokens/generate";
import { prisma } from "@/lib/prisma";
import { getBunnyEmbedUrl } from "@/lib/bunny/signed-url";

interface RouteContext {
  params: Promise<{ tokenId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { tokenId } = await context.params;

  // --- Token lookup ---
  const token = await prisma.videoToken.findUnique({
    where: { token: tokenId },
    include: {
      lesson: { select: { bunny_video_id: true, title: true } },
      user: { select: { email: true } },
    },
  });

  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  if (token.is_revoked) {
    return NextResponse.json({ error: "Token revoked" }, { status: 410 });
  }

  if (token.expires_at < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  if (token.current_views >= token.max_views) {
    return NextResponse.json({ error: "Max views reached" }, { status: 410 });
  }

  // Increment views
  await prisma.videoToken.update({
    where: { id: token.id },
    data: { current_views: { increment: 1 }, last_used_at: new Date() },
  });

  const remainingViews = token.max_views - (token.current_views + 1);

  // Build Bunny embed URL
  let bunnyEmbedUrl: string | undefined;
  if (token.lesson.bunny_video_id) {
    try {
      const bunny = getBunnyEmbedUrl(token.lesson.bunny_video_id);
      bunnyEmbedUrl = bunny.url;
    } catch (err) {
      console.error("[video route] Bunny embed error:", err);
    }
  }

  const html = renderSecurePlayerHtml({
    userEmail: token.user.email,
    title: token.lesson.title,
    remaining: remainingViews,
    expiresAt: token.expires_at.toISOString(),
    bunnyEmbedUrl,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
