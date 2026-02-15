import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { lessonId, courseId, rating, comment } = await req.json();

  if (!lessonId || !courseId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const trimmedComment = comment?.trim().slice(0, 280) || null;

  await prisma.lessonReview.upsert({
    where: { user_id_lesson_id: { user_id: user.id, lesson_id: lessonId } },
    update: { rating, comment: trimmedComment },
    create: {
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      rating,
      comment: trimmedComment,
    },
  });

  return NextResponse.json({ ok: true });
}
