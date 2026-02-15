import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

const PAGE_SIZE = 20;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor");

  const comments = await prisma.lessonComment.findMany({
    where: { lesson_id: lessonId },
    orderBy: { created_at: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      content: true,
      created_at: true,
      user: { select: { id: true, full_name: true, avatar_url: true } },
    },
  });

  const hasMore = comments.length > PAGE_SIZE;
  const items = hasMore ? comments.slice(0, PAGE_SIZE) : comments;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ comments: items, nextCursor });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { lessonId } = await params;
  const body = await req.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const courseId = body.courseId;

  if (!content || content.length > 500 || !courseId) {
    return NextResponse.json({ error: "Contenido invalido" }, { status: 400 });
  }

  const comment = await prisma.lessonComment.create({
    data: {
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      content,
    },
    select: {
      id: true,
      content: true,
      created_at: true,
      user: { select: { id: true, full_name: true, avatar_url: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
