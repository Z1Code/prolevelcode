import { nanoid } from "nanoid";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { signVideoAccess } from "@/lib/tokens/hmac";
import type { VideoTokenResponse } from "@/lib/types";

const CONCURRENT_SESSION_STALE_MS = 2 * 60 * 1000; // 2 minutes

interface GenerateVideoTokenParams {
  userId: string;
  lessonId: string;
  courseId: string;
  ipAddress: string;
  userAgent: string;
  fingerprint?: string;
}

export async function generateVideoToken(params: GenerateVideoTokenParams): Promise<VideoTokenResponse> {
  const { userId, lessonId, courseId, ipAddress, userAgent, fingerprint } = params;

  const enrollment = await prisma.enrollment.findFirst({
    where: { user_id: userId, course_id: courseId, status: "active" },
  });

  if (!enrollment) {
    throw new Error("NO_ENROLLMENT");
  }

  // --- Concurrent session check ---
  // Clean stale sessions first
  await prisma.activeVideoSession.deleteMany({
    where: {
      user_id: userId,
      last_heartbeat: { lt: new Date(Date.now() - CONCURRENT_SESSION_STALE_MS) },
    },
  });

  // Check if user has an active video session on a different device
  if (fingerprint) {
    const activeSessions = await prisma.activeVideoSession.findMany({
      where: { user_id: userId },
    });

    const otherDevice = activeSessions.find((s) => s.fingerprint !== fingerprint);
    if (otherDevice) {
      throw new Error("CONCURRENT_SESSION");
    }
  }

  // --- Token reuse ---
  const existingTokens = await prisma.videoToken.findMany({
    where: {
      user_id: userId,
      lesson_id: lessonId,
      is_revoked: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
    take: 3,
  });

  const existing = existingTokens.find((item) => item.current_views < item.max_views);

  if (existing) {
    const sig = signVideoAccess(existing.id, userId, env.tokenDefaultTtl);
    return {
      token: existing.token,
      videoUrl: `/api/video/${existing.token}?sig=${sig}`,
      expiresAt: existing.expires_at.toISOString(),
      remainingViews: existing.max_views - existing.current_views,
    };
  }

  // --- Create new token ---
  const ttlSeconds = env.tokenDefaultTtl;
  const maxViews = env.tokenDefaultMaxViews;
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const newToken = await prisma.videoToken.create({
    data: {
      token,
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      expires_at: expiresAt,
      max_views: maxViews,
      ttl_seconds: ttlSeconds,
      ip_address: ipAddress,
      allowed_ips: [ipAddress],
      user_agent: userAgent,
    },
  });

  await prisma.tokenUsageLog.create({
    data: {
      token_id: newToken.id,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      action: "generated",
    },
  });

  const sig = signVideoAccess(newToken.id, userId, ttlSeconds);

  return {
    token: newToken.token,
    videoUrl: `/api/video/${newToken.token}?sig=${sig}`,
    expiresAt: newToken.expires_at.toISOString(),
    remainingViews: newToken.max_views - newToken.current_views,
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

export function renderSecurePlayerHtml(input: {
  youtubeId: string;
  userEmail: string;
  title: string;
  remaining: number;
  expiresAt: string;
  tokenId: string;
  heartbeatUrl: string;
}) {
  const { youtubeId, userEmail, title, remaining, expiresAt, tokenId, heartbeatUrl } = input;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#000;color:#fff;font-family:Inter,system-ui,sans-serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;overflow:hidden;user-select:none}
    .player{position:relative;width:min(95vw,1100px);aspect-ratio:16/9}
    iframe{width:100%;height:100%;border:0;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.5)}
    .watermark{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;opacity:.08;transform:rotate(-24deg);font-weight:700;letter-spacing:.4rem}
    .bar{display:flex;gap:16px;font-size:12px;color:#9ca3af;flex-wrap:wrap;justify-content:center}
    .warn{color:#f97316}
    .revoked-overlay{position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.95);z-index:100}
    .revoked-overlay h2{color:#ef4444;font-size:20px;text-align:center;max-width:440px;line-height:1.6}
  </style>
</head>
<body oncontextmenu="return false">
  <div class="player">
    <iframe id="player-frame" src="https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&controls=1&iv_load_policy=3" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    <div class="watermark">${userEmail}</div>
  </div>
  <div class="bar">
    <span>${title}</span>
    <span>Vistas restantes: ${remaining}</span>
    <span class="warn">Expira: ${new Date(expiresAt).toLocaleString("es-ES")}</span>
  </div>
  <script>
    // Anti-screenshot / print
    document.addEventListener('keydown', function(e) {
      var blocked = e.key === 'PrintScreen' || (e.ctrlKey && e.key.toLowerCase() === 'p');
      if (blocked) {
        e.preventDefault();
        document.body.style.filter = 'blur(24px)';
        setTimeout(function() { document.body.style.filter = ''; }, 1200);
      }
    });

    // Expiration check
    var expiry = new Date('${expiresAt}').getTime();
    setInterval(function() {
      if (Date.now() > expiry) {
        var iframe = document.getElementById('player-frame');
        if (iframe) iframe.src = '';
        document.body.innerHTML = '<div class="revoked-overlay"><h2>Token expirado. Regresa al curso para generar uno nuevo.</h2></div>';
      }
    }, 15000);

    // Device fingerprint (inline lightweight version)
    function getFingerprint() {
      var signals = [
        screen.width, screen.height, screen.colorDepth,
        navigator.language, navigator.hardwareConcurrency,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.platform, navigator.userAgent
      ].join('|');
      var hash = 0;
      for (var i = 0; i < signals.length; i++) {
        hash = ((hash << 5) - hash) + signals.charCodeAt(i);
        hash |= 0;
      }
      return 'fp_' + Math.abs(hash).toString(36);
    }

    // Heartbeat — keeps session alive, detects concurrent usage
    var fp = getFingerprint();
    function sendHeartbeat() {
      fetch('${heartbeatUrl}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tokenId: '${tokenId}', fingerprint: fp })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.active === false) {
          var iframe = document.getElementById('player-frame');
          if (iframe) iframe.src = '';
          document.body.innerHTML = '<div class="revoked-overlay"><h2>Se detect\\u00f3 una sesi\\u00f3n activa en otro dispositivo. Solo se permite una reproducci\\u00f3n simult\\u00e1nea por cuenta.</h2></div>';
        }
      })
      .catch(function() {});
    }

    sendHeartbeat();
    setInterval(sendHeartbeat, 30000);
  </script>
</body>
</html>`;
}
