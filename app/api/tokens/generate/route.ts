import { NextResponse } from "next/server";
import { generateTokenSchema } from "@/lib/validators/api";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { generateVideoToken } from "@/lib/tokens/generate";

export async function POST(request: Request) {
  const context = await requireApiUser();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const parsed = generateTokenSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  const lesson = await prisma.lesson.findFirst({
    where: { id: parsed.data.lessonId, course_id: parsed.data.courseId },
    select: { id: true, course_id: true },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found for course" }, { status: 404 });
  }

  try {
    const token = await generateVideoToken({
      userId: context.user.id,
      lessonId: parsed.data.lessonId,
      courseId: parsed.data.courseId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(token);
  } catch (error) {
    if (error instanceof Error && error.message === "NO_ENROLLMENT") {
      return NextResponse.json({ error: "No active enrollment" }, { status: 403 });
    }

    console.error("[tokens/generate] Error:", error);
    return NextResponse.json({ error: "Could not generate token" }, { status: 500 });
  }
}
