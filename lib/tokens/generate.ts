import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { checkCourseAccess } from "@/lib/access/check-access";
import type { VideoTokenResponse } from "@/lib/types";

interface GenerateVideoTokenParams {
  userId: string;
  lessonId: string;
  courseId: string;
  ipAddress: string;
  userAgent: string;
}

export async function generateVideoToken(params: GenerateVideoTokenParams): Promise<VideoTokenResponse> {
  const { userId, lessonId, courseId, ipAddress, userAgent } = params;

  const access = await checkCourseAccess(userId, courseId);
  if (!access.granted) {
    throw new Error("NO_ENROLLMENT");
  }

  // Reuse existing valid token if available
  const existing = await prisma.videoToken.findFirst({
    where: {
      user_id: userId,
      lesson_id: lessonId,
      is_revoked: false,
      expires_at: { gt: new Date() },
      current_views: { lt: 50 },
    },
    orderBy: { created_at: "desc" },
  });

  if (existing) {
    return {
      token: existing.token,
      videoUrl: `/api/video/${existing.token}`,
      expiresAt: existing.expires_at.toISOString(),
      remainingViews: 50 - existing.current_views,
    };
  }

  // Create new token — generous limits
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const newToken = await prisma.videoToken.create({
    data: {
      token,
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      expires_at: expiresAt,
      max_views: 50,
      ttl_seconds: 86400,
      ip_address: ipAddress,
      allowed_ips: [],
      user_agent: userAgent,
    },
  });

  return {
    token: newToken.token,
    videoUrl: `/api/video/${newToken.token}`,
    expiresAt: newToken.expires_at.toISOString(),
    remainingViews: 50,
  };
}

export async function logTokenUsage(input: {
  tokenId: string;
  userId: string | null;
  ipAddress: string;
  userAgent: string;
  action: "generated" | "validated" | "viewed" | "expired" | "revoked" | "rejected";
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.tokenUsageLog.create({
    data: {
      token_id: input.tokenId,
      user_id: input.userId,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
      action: input.action,
      rejection_reason: input.rejectionReason ?? null,
      metadata: (input.metadata as object) ?? undefined,
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface SecurePlayerInput {
  userEmail: string;
  title: string;
  remaining: number;
  expiresAt: string;
  bunnyEmbedUrl?: string;
}

export function renderSecurePlayerHtml(input: SecurePlayerInput) {
  const { userEmail, title, remaining, expiresAt, bunnyEmbedUrl } = input;

  const safeTitle = escapeHtml(title);
  const safeEmail = escapeHtml(userEmail);

  const bunnyBlock = bunnyEmbedUrl
    ? `var iframe = document.createElement('iframe');
    iframe.src = '${bunnyEmbedUrl.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.style.cssText = 'width:100%;height:100%;border:0;border-radius:12px';
    document.getElementById('vp').appendChild(iframe);`
    : `document.getElementById('vp').innerHTML = '<p style="color:#ef4444;text-align:center;padding-top:40%">Video no disponible</p>';`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${safeTitle}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#000;color:#fff;font-family:Inter,system-ui,sans-serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;overflow:hidden}
    .player{position:relative;width:min(95vw,1100px);aspect-ratio:16/9}
    #vp{width:100%;height:100%;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.5)}
    iframe{border:0;border-radius:12px}
    .watermark{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;opacity:.06;transform:rotate(-24deg);font-weight:700;letter-spacing:.4rem;z-index:6}
    .bar{display:flex;gap:16px;font-size:12px;color:#9ca3af;flex-wrap:wrap;justify-content:center}
  </style>
</head>
<body>
  <div class="player">
    <div id="vp"></div>
    <div class="watermark">${safeEmail}</div>
  </div>
  <div class="bar">
    <span>${safeTitle}</span>
    <span>Vistas restantes: ${remaining}</span>
  </div>
  <script>
  (function(){
    ${bunnyBlock}
  })();
  </script>
</body>
</html>`;
}
