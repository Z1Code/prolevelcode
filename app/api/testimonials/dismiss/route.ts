import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertRateLimit } from "@/lib/utils/rate-limit";
import { jsonError } from "@/lib/utils/http";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allowed = await assertRateLimit("testimonials/dismiss", user.id, 10, 60);
  if (!allowed) {
    return jsonError("Too many requests", 429);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { testimonial_dismissed_at: new Date() },
  });

  return NextResponse.json({ ok: true });
}
