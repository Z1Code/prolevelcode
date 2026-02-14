import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/utils/data";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { checkCourseAccess, getUserTier } from "@/lib/access/check-access";
import { TierBadge } from "@/components/courses/tier-badge";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface CourseLesson {
  id: string;
  title: string;
  is_free_preview?: boolean;
  duration_minutes?: number | null;
}

interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

/**
 * Compute thumbnail URL server-side so no video IDs leak to the client.
 */
async function getCourseThumbnail(course: {
  id: string;
  thumbnail_url?: string | null;
  preview_video_url?: string | null;
}): Promise<string | null> {
  if (course.thumbnail_url) return course.thumbnail_url;

  try {
    const previewLesson = await prisma.lesson.findFirst({
      where: { course_id: course.id, is_free_preview: true },
      orderBy: { sort_order: "asc" },
      select: { bunny_video_id: true, bunny_thumbnail_url: true, youtube_video_id: true },
    });

    if (previewLesson?.bunny_thumbnail_url) return previewLesson.bunny_thumbnail_url;
    if (previewLesson?.bunny_video_id) {
      const { getBunnyThumbnailUrl } = await import("@/lib/bunny/signed-url");
      return getBunnyThumbnailUrl(previewLesson.bunny_video_id);
    }
    if (previewLesson?.youtube_video_id) {
      return `https://img.youtube.com/vi/${previewLesson.youtube_video_id}/maxresdefault.jpg`;
    }
  } catch {
    // fallback
  }

  const youtubeId = course.preview_video_url ?? null;
  return youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    : null;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const modules = (Array.isArray(course.modules) ? course.modules : []) as CourseModule[];
  const user = await getSessionUser();

  let hasAccess = false;
  let userTier: "pro" | "basic" | null = null;
  if (user && course.id) {
    const access = await checkCourseAccess(user.id, course.id);
    hasAccess = access.granted;
    userTier = await getUserTier(user.id);
  }

  const courseTierAccess = (course as { tier_access?: string }).tier_access ?? "basic";
  const isComingSoon = (course as { is_coming_soon?: boolean }).is_coming_soon ?? false;

  const thumbnailUrl = await getCourseThumbnail(course);

  return (
    <main className="container-wide section-spacing liquid-section">
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold md:text-5xl">{course.title}</h1>
            <TierBadge tier={courseTierAccess} isComingSoon={isComingSoon} />
          </div>
          <p className="mt-4 max-w-3xl text-slate-300">{course.long_description ?? course.subtitle ?? course.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {isComingSoon ? (
              <span className="text-sm text-amber-300">Este curso estara disponible proximamente</span>
            ) : hasAccess ? (
              <Link href={`/dashboard/cursos/${slug}`}>
                <Button>Ir al curso →</Button>
              </Link>
            ) : user ? (
              <div className="space-y-3">
                {courseTierAccess === "pro" && userTier !== "pro" ? (
                  <div className="rounded-lg border border-violet-400/20 bg-violet-500/5 p-3">
                    <p className="text-sm text-violet-200">
                      Este curso requiere el plan Pro.{" "}
                      <Link href="/planes" className="font-medium underline">Ver planes</Link>
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3">
                    <p className="text-sm text-emerald-200">
                      Accede a este curso con un plan.{" "}
                      <Link href="/planes" className="font-medium underline">Ver planes</Link>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Link href={`/login?next=${encodeURIComponent(`/cursos/${slug}`)}`}>
                <Button>Inicia sesion para acceder</Button>
              </Link>
            )}
          </div>
        </div>

        {thumbnailUrl && (
          <div className="aspect-video overflow-hidden rounded-2xl border border-white/10">
            <img
              src={thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {!thumbnailUrl && (
          <div className="aspect-video rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/40 via-slate-950 to-violet-500/25" />
        )}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Contenido</h2>
        <div className="mt-4 space-y-4">
          {modules.map((module) => (
            <article key={module.id} className="liquid-surface p-4">
              <h3 className="font-medium">{module.title}</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                {module.lessons?.map((lesson) => (
                  <li key={lesson.id} className="flex items-center gap-2">
                    <span>- {lesson.title}</span>
                    {lesson.is_free_preview && (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">GRATIS</span>
                    )}
                    {lesson.duration_minutes && (
                      <span className="text-xs text-slate-500">{lesson.duration_minutes} min</span>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
