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

  // Fetch all video data from Bunny in parallel
  const fetchResults = await Promise.allSettled(
    lessons.map(async (lesson) => {
      const res = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${lesson.bunny_video_id}`,
        { headers: { AccessKey: apiKey } },
      );

      if (!res.ok) {
        throw new Error(`Bunny API ${res.status}`);
      }

      const data = (await res.json()) as { length?: number };
      const seconds = data.length ?? 0;

      if (seconds <= 0) {
        throw new Error("Video has no duration (still encoding?)");
      }

      return { lesson, minutes: Math.ceil(seconds / 60) };
    }),
  );

  // Process fetch results and update lessons in parallel
  const lessonsToUpdate: { id: string; minutes: number }[] = [];
  for (let i = 0; i < fetchResults.length; i++) {
    const result = fetchResults[i];
    if (result.status === "fulfilled") {
      lessonsToUpdate.push({ id: result.value.lesson.id, minutes: result.value.minutes });
    } else {
      const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push({ title: lessons[i].title, error: msg });
      failed++;
    }
  }

  // Update all lesson durations in parallel
  const updateResults = await Promise.allSettled(
    lessonsToUpdate.map((item) =>
      prisma.lesson.update({
        where: { id: item.id },
        data: { duration_minutes: item.minutes },
      }),
    ),
  );

  for (let i = 0; i < updateResults.length; i++) {
    const result = updateResults[i];
    if (result.status === "fulfilled") {
      updated++;
    } else {
      const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push({ title: lessonsToUpdate[i].id, error: msg });
      failed++;
    }
  }

  // Update total_duration_minutes on all affected courses
  if (updated > 0) {
    const courses = await prisma.course.findMany({
      where: { lessons: { some: { bunny_video_id: { not: null } } } },
      select: { id: true, lessons: { select: { duration_minutes: true } } },
    });

    await Promise.allSettled(
      courses.map((course) => {
        const total = course.lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);
        return prisma.course.update({
          where: { id: course.id },
          data: { total_duration_minutes: total > 0 ? total : null },
        });
      }),
    );
  }

  return NextResponse.json({ updated, failed, total: lessons.length, errors: errors.length > 0 ? errors : undefined });
}
