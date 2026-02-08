import { nanoid } from "nanoid";
import { env } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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
  const supabase = createAdminSupabaseClient();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id,status")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) {
    throw new Error("NO_ENROLLMENT");
  }

  const { data: existingTokens } = await supabase
    .from("video_tokens")
    .select("id,token,expires_at,max_views,current_views")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .eq("is_revoked", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(3);

  const existing = existingTokens?.find((item) => Number(item.current_views ?? 0) < Number(item.max_views ?? 0));

  if (existing) {
    const currentViews = Number(existing.current_views ?? 0);
    const maxViews = Number(existing.max_views ?? 0);

    return {
      token: String(existing.token),
      videoUrl: `/api/video/${String(existing.token)}`,
      expiresAt: String(existing.expires_at),
      remainingViews: maxViews - currentViews,
    };
  }

  const ttlSeconds = env.tokenDefaultTtl;
  const maxViews = env.tokenDefaultMaxViews;
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const { data: newToken, error: insertError } = await supabase
    .from("video_tokens")
    .insert({
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
    })
    .select("id,token,expires_at,max_views,current_views")
    .single();

  if (insertError || !newToken) {
    console.error(insertError);
    throw new Error("TOKEN_INSERT_FAILED");
  }

  await supabase.from("token_usage_logs").insert({
    token_id: newToken.id,
    user_id: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
    action: "generated",
  });

  return {
    token: String(newToken.token),
    videoUrl: `/api/video/${String(newToken.token)}`,
    expiresAt: String(newToken.expires_at),
    remainingViews: Number(newToken.max_views ?? 0) - Number(newToken.current_views ?? 0),
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
  const supabase = createAdminSupabaseClient();

  await supabase.from("token_usage_logs").insert({
    token_id: input.tokenId,
    user_id: input.userId,
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
    action: input.action,
    rejection_reason: input.rejectionReason ?? null,
    metadata: input.metadata ?? {},
  });
}

export function renderSecurePlayerHtml(input: {
  youtubeId: string;
  userEmail: string;
  title: string;
  remaining: number;
  expiresAt: string;
}) {
  const { youtubeId, userEmail, title, remaining, expiresAt } = input;

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
  </style>
</head>
<body oncontextmenu="return false">
  <div class="player">
    <iframe src="https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&controls=1&iv_load_policy=3" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    <div class="watermark">${userEmail}</div>
  </div>
  <div class="bar">
    <span>${title}</span>
    <span>Vistas restantes: ${remaining}</span>
    <span class="warn">Expira: ${new Date(expiresAt).toLocaleString("es-ES")}</span>
  </div>
  <script>
    document.addEventListener('keydown', (e) => {
      const blocked = e.key === 'PrintScreen' || (e.ctrlKey && e.key.toLowerCase() === 'p');
      if (blocked) {
        e.preventDefault();
        document.body.style.filter = 'blur(24px)';
        setTimeout(() => document.body.style.filter = '', 1200);
      }
    });
    const expiry = new Date('${expiresAt}').getTime();
    setInterval(() => {
      if (Date.now() > expiry) {
        const iframe = document.querySelector('iframe');
        if (iframe) iframe.src = '';
        document.body.innerHTML = '<h1 style="color:#ef4444;font-size:20px">Token expirado. Regresa al curso para generar uno nuevo.</h1>';
      }
    }, 15000);
  </script>
</body>
</html>`;
}
