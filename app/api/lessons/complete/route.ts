import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertRateLimit } from "@/lib/utils/rate-limit";
import { jsonError } from "@/lib/utils/http";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const allowed = await assertRateLimit("lessons/complete", user.id, 30, 60);
  if (!allowed) {
    return jsonError("Too many requests", 429);
  }

  const { lessonId, courseId } = await req.json();
  if (!lessonId || !courseId) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  await prisma.lessonProgress.upsert({
    where: { user_id_lesson_id: { user_id: user.id, lesson_id: lessonId } },
    update: { is_completed: true, completed_at: new Date() },
    create: {
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      is_completed: true,
      completed_at: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
