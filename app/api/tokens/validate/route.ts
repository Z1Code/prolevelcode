import { NextResponse } from "next/server";
import { validateTokenSchema } from "@/lib/validators/api";
import { requireApiUser } from "@/lib/auth/api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const context = await requireApiUser();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const parsed = validateTokenSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: token } = await supabase
    .from("video_tokens")
    .select("id,token,user_id,expires_at,max_views,current_views,is_revoked")
    .eq("token", parsed.data.token)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (!token) return NextResponse.json({ error: "Token not found" }, { status: 404 });

  const currentViews = Number(token.current_views ?? 0);
  const maxViews = Number(token.max_views ?? 0);

  if (token.is_revoked) return NextResponse.json({ error: "Token revoked" }, { status: 410 });
  if (new Date(String(token.expires_at)) < new Date()) return NextResponse.json({ error: "Token expired" }, { status: 410 });
  if (currentViews >= maxViews) return NextResponse.json({ error: "Max views reached" }, { status: 410 });

  return NextResponse.json({
    valid: true,
    token: String(token.token),
    remainingViews: maxViews - currentViews,
    expiresAt: String(token.expires_at),
  });
}
