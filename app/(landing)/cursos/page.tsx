import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCourses } from "@/lib/utils/data";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { getBunnyThumbnailUrl } from "@/lib/bunny/signed-url";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { CourseTimeline } from "@/components/courses/course-timeline";

export const metadata: Metadata = {
  title: "Cursos de Programacion | ProLevelCode",
  description: "Cursos orientados a resultados con proyectos reales y acceso de por vida. Aprende Next.js, TypeScript, IA y mas.",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

<<<<<<< HEAD
  // Get first ready lesson per course for thumbnails
=======
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
>>>>>>> d257dd548c744f37ab00ed59f2d3839e003b43ee
  const courseIds = courses.map((c) => c.id).filter(Boolean);
  const thumbLessons = courseIds.length
    ? await prisma.lesson.findMany({
        where: { course_id: { in: courseIds }, mux_status: "ready", thumbnail_url: { not: null } },
        orderBy: { sort_order: "asc" },
<<<<<<< HEAD
        select: { course_id: true, thumbnail_url: true },
=======
        select: { course_id: true, youtube_video_id: true, bunny_video_id: true, bunny_thumbnail_url: true },
>>>>>>> d257dd548c744f37ab00ed59f2d3839e003b43ee
      })
    : [];

  const thumbnailMap = new Map<string, string>();
<<<<<<< HEAD
  for (const lesson of thumbLessons) {
    if (lesson.thumbnail_url && !thumbnailMap.has(lesson.course_id)) {
      thumbnailMap.set(lesson.course_id, lesson.thumbnail_url);
=======
  for (const lesson of previewLessons) {
    if (!thumbnailMap.has(lesson.course_id)) {
      if (lesson.bunny_thumbnail_url) {
        thumbnailMap.set(lesson.course_id, lesson.bunny_thumbnail_url);
      } else if (lesson.bunny_video_id) {
        thumbnailMap.set(lesson.course_id, getBunnyThumbnailUrl(lesson.bunny_video_id));
      } else if (lesson.youtube_video_id) {
        thumbnailMap.set(lesson.course_id, `https://img.youtube.com/vi/${lesson.youtube_video_id}/mqdefault.jpg`);
      }
>>>>>>> d257dd548c744f37ab00ed59f2d3839e003b43ee
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

<<<<<<< HEAD
      <div className="mt-10 space-y-4">
        {courses.map((course) => {
          const thumb = course.thumbnail_url || thumbnailMap.get(course.id) || null;

          return (
            <Card key={course.id} className="p-5">
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={course.title}
                    className="aspect-video w-full rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="aspect-video rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/40 via-slate-950 to-violet-500/25" />
                )}
                <div>
                  <h2 className="text-2xl font-semibold">{course.title}</h2>
                  <p className="mt-2 text-slate-400">{course.subtitle ?? course.description}</p>
                  <p className="mt-4 text-sm text-slate-300">
                    {course.total_lessons ?? 0} lecciones - {course.total_duration_minutes ?? 0} min
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="liquid-pill text-sm">{currencyFormatter(course.price_cents, course.currency)}</span>
                    <Link href={`/cursos/${course.slug}`}>
                      <Button size="sm">Ver curso</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
=======
      <div className="mt-6 flex items-center gap-3">
        <Link href="/planes">
          <Button size="sm">Ver planes ($29 / $99)</Button>
        </Link>
>>>>>>> d257dd548c744f37ab00ed59f2d3839e003b43ee
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
