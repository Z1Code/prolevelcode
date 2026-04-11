import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import { getMux } from "@/lib/mux";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const lessonId = body?.lessonId;

  if (typeof lessonId !== "string" || !lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const upload = await getMux().video.uploads.create({
    new_asset_settings: {
      playback_policy: ["public"],
      video_quality: "plus",
      passthrough: lessonId,
    },
    cors_origin: "*",
  });

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { mux_upload_id: upload.id, mux_status: "processing" },
  });

  return NextResponse.json({ uploadUrl: upload.url, uploadId: upload.id });
}
