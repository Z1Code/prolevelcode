import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { requireEnv } from "@/lib/env";
import { jsonError } from "@/lib/utils/http";

/**
 * POST /api/admin/bunny/sync-durations
 * Fetches video duration from Bunny Stream API for all lessons
 * that have a bunny_video_id but no duration_minutes.
 */
export async function POST() {
  const context = await requireApiAdmin();
  if (!context) return jsonError("Unauthorized", 401);

  const libraryId = requireEnv("bunnyStreamLibraryId");
  const apiKey = requireEnv("bunnyStreamApiKey");

  // Find lessons missing duration
  const lessons = await prisma.lesson.findMany({
    where: {
      bunny_video_id: { not: null },
      duration_minutes: null,
    },
    select: { id: true, bunny_video_id: true, title: true },
  });

  if (lessons.length === 0) {
    return NextResponse.json({ message: "All lessons already have duration", updated: 0, failed: 0 });
  }

  let updated = 0;
  let failed = 0;
  const errors: { title: string; error: string }[] = [];

  for (const lesson of lessons) {
    try {
      const res = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${lesson.bunny_video_id}`,
        { headers: { AccessKey: apiKey } },
      );

      if (!res.ok) {
        errors.push({ title: lesson.title, error: `Bunny API ${res.status}` });
        failed++;
        continue;
      }

      const data = (await res.json()) as { length?: number };
      const seconds = data.length ?? 0;

      if (seconds <= 0) {
        errors.push({ title: lesson.title, error: "Video has no duration (still encoding?)" });
        failed++;
        continue;
      }

      const minutes = Math.ceil(seconds / 60);

      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { duration_minutes: minutes },
      });

      updated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ title: lesson.title, error: msg });
      failed++;
    }
  }

  // Update total_duration_minutes on all affected courses
  if (updated > 0) {
    const courses = await prisma.course.findMany({
      where: { lessons: { some: { bunny_video_id: { not: null } } } },
      select: { id: true, lessons: { select: { duration_minutes: true } } },
    });

    for (const course of courses) {
      const total = course.lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);
      await prisma.course.update({
        where: { id: course.id },
        data: { total_duration_minutes: total > 0 ? total : null },
      });
    }
  }

  return NextResponse.json({ updated, failed, total: lessons.length, errors: errors.length > 0 ? errors : undefined });
}
