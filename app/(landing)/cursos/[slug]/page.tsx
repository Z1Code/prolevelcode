import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/utils/data";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { currencyFormatter } from "@/lib/payments/helpers";
import { VideoPreviewModal } from "@/components/video/video-preview-modal";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string }>;
}

interface CourseLesson {
  id: string;
  title: string;
  youtube_video_id?: string;
  is_free_preview?: boolean;
  duration_minutes?: number | null;
}

interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export default async function CourseDetailPage({ params, searchParams }: CourseDetailPageProps) {
  const { slug } = await params;
  const { checkout } = await searchParams;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const modules = (Array.isArray(course.modules) ? course.modules : []) as CourseModule[];
  const user = await getSessionUser();

  // Check if user is already enrolled
  let isEnrolled = false;
  if (user && course.id) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { user_id: user.id, course_id: course.id, status: "active" },
    });
    isEnrolled = !!enrollment;
  }

  // Find first free preview lesson for the preview button and thumbnail
  const allLessons = modules.flatMap((m) => m.lessons);
  const previewLesson = allLessons.find((l) => l.is_free_preview && l.youtube_video_id);
  const previewYoutubeId = course.preview_video_url || previewLesson?.youtube_video_id || null;

  // Thumbnail from YouTube
  const thumbnailUrl = course.thumbnail_url || (previewYoutubeId ? `https://img.youtube.com/vi/${previewYoutubeId}/maxresdefault.jpg` : null);

  return (
    <main className="container-wide section-spacing liquid-section">
      {checkout === "error" && (
        <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          No se pudo iniciar el pago. Intenta de nuevo mas tarde o contactanos.
        </div>
      )}
      {checkout === "failure" && (
        <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          El pago no se completo. Puedes intentar de nuevo.
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <h1 className="text-4xl font-bold md:text-5xl">{course.title}</h1>
          <p className="mt-4 max-w-3xl text-slate-300">{course.long_description ?? course.subtitle ?? course.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {course.price_cents != null && (
              <span className="liquid-pill text-sm">{currencyFormatter(course.price_cents, course.currency)}</span>
            )}

            {isEnrolled ? (
              <Link href={`/dashboard/cursos/${slug}`}>
                <Button>Ir al curso →</Button>
              </Link>
            ) : user ? (
              <form action="/api/checkout/course" method="post">
                <input type="hidden" name="courseId" value={course.id ?? ""} />
                <Button type="submit">Comprar curso</Button>
              </form>
            ) : (
              <Link href={`/login?next=${encodeURIComponent(`/cursos/${slug}`)}`}>
                <Button>Inicia sesion para comprar</Button>
              </Link>
            )}

            {previewYoutubeId && (
              <VideoPreviewModal youtubeId={previewYoutubeId} title={`Preview: ${course.title}`} />
            )}
          </div>
        </div>

        {/* Thumbnail / preview image */}
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
