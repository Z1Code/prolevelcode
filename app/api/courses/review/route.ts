import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { courseId, rating, comment } = await req.json();

  if (!courseId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const trimmedComment = (comment?.trim() || "").slice(0, 500);
  if (!trimmedComment) {
    return NextResponse.json({ error: "El comentario es requerido" }, { status: 400 });
  }

  await prisma.courseReview.upsert({
    where: { user_id_course_id: { user_id: user.id, course_id: courseId } },
    update: { rating, comment: trimmedComment },
    create: {
      user_id: user.id,
      course_id: courseId,
      rating,
      comment: trimmedComment,
    },
  });

  return NextResponse.json({ ok: true });
}
