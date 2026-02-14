import Link from "next/link";
import { getPublishedCourses } from "@/lib/utils/data";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { getBunnyThumbnailUrl } from "@/lib/bunny/signed-url";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { CourseTimeline } from "@/components/courses/course-timeline";

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  const basicCourses = courses.filter((c) => (c.tier_access ?? "basic") === "basic");
  const proCourses = courses.filter((c) => (c.tier_access ?? "basic") === "pro");

  // Get user + tier
  const user = await getSessionUser();
  const userTier = user ? await getUserTier(user.id) : null;

  // Get enrolled course IDs for grandfathered access
  let enrolledCourseIds = new Set<string>();
  if (user) {
    const enrollments = await prisma.enrollment.findMany({
      where: { user_id: user.id, status: "active" },
      select: { course_id: true },
    });
    enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
  }

  // Build thumbnail map from preview lessons
  const courseIds = courses.map((c) => c.id).filter(Boolean);
  const previewLessons = courseIds.length
    ? await prisma.lesson.findMany({
        where: { course_id: { in: courseIds }, is_free_preview: true },
        orderBy: { sort_order: "asc" },
        select: { course_id: true, youtube_video_id: true, bunny_video_id: true, bunny_thumbnail_url: true },
      })
    : [];

  const thumbnailMap = new Map<string, string>();
  for (const lesson of previewLessons) {
    if (!thumbnailMap.has(lesson.course_id)) {
      if (lesson.bunny_thumbnail_url) {
        thumbnailMap.set(lesson.course_id, lesson.bunny_thumbnail_url);
      } else if (lesson.bunny_video_id) {
        thumbnailMap.set(lesson.course_id, getBunnyThumbnailUrl(lesson.bunny_video_id));
      } else if (lesson.youtube_video_id) {
        thumbnailMap.set(lesson.course_id, `https://img.youtube.com/vi/${lesson.youtube_video_id}/mqdefault.jpg`);
      }
    }
  }

  // Map courses to timeline format
  const mapCourse = (c: (typeof courses)[number]) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle ?? null,
    description: c.description ?? null,
    thumbnail_url: c.thumbnail_url ?? null,
    total_lessons: c.total_lessons ?? null,
    total_duration_minutes: c.total_duration_minutes ?? null,
    tier_access: c.tier_access ?? "basic",
    is_coming_soon: c.is_coming_soon ?? false,
  });

  return (
    <main className="container-wide section-spacing liquid-section">
      <h1 className="text-4xl font-bold md:text-6xl">Catalogo de cursos</h1>
      <p className="mt-4 max-w-2xl text-slate-300">
        Cursos orientados a resultados con proyectos reales y acceso de por vida.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link href="/planes">
          <Button size="sm">Ver planes ($29 / $99)</Button>
        </Link>
      </div>

        <CourseTimeline
          basicCourses={basicCourses.map(mapCourse)}
          proCourses={proCourses.map(mapCourse)}
          userTier={userTier}
          enrolledCourseIds={enrolledCourseIds}
          thumbnailMap={thumbnailMap}
        />
    </main>
  );
}
