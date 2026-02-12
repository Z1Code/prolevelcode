import Link from "next/link";
import { getPublishedCourses } from "@/lib/utils/data";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currencyFormatter } from "@/lib/payments/helpers";
import { getBunnyThumbnailUrl } from "@/lib/bunny/signed-url";
import { COURSE_CATEGORIES } from "@/lib/courses/categories";
import { CategoryFilter } from "@/components/courses/category-filter";
import { TierBadge } from "@/components/courses/tier-badge";
import { CoursesCountdown } from "./courses-countdown";

interface CoursesPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { category: activeCategory } = await searchParams;
  let courses = await getPublishedCourses();

  if (activeCategory) {
    courses = courses.filter((c) => c.category === activeCategory);
  }

  // Get first free preview lesson per course for thumbnails
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

  return (
    <main className="container-wide section-spacing liquid-section">
      <h1 className="text-4xl font-bold md:text-6xl">Catalogo de cursos</h1>
      <p className="mt-4 max-w-2xl text-slate-300">
        Cursos orientados a resultados con proyectos reales y acceso de por vida.
      </p>

      <CoursesCountdown>
        <div className="mt-6">
          <CategoryFilter categories={COURSE_CATEGORIES} active={activeCategory} />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Link href="/planes">
            <Button size="sm" variant="ghost">Ver planes ($30 / $99)</Button>
          </Link>
        </div>

        <div className="mt-6 space-y-4">
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
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-semibold">{course.title}</h2>
                      <TierBadge tier={(course as { tier_access?: string }).tier_access ?? "basic"} isComingSoon={(course as { is_coming_soon?: boolean }).is_coming_soon ?? false} />
                    </div>
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
        </div>
      </CoursesCountdown>
    </main>
  );
}
