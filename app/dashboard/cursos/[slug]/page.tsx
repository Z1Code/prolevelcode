import Link from "next/link";
import { notFound } from "next/navigation";
import { SecureCoursePlayer } from "@/components/video/secure-course-player";
import { CourseReviewSection } from "@/components/video/course-review-section";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { checkCourseAccess, getUserTier } from "@/lib/access/check-access";

interface DashboardCoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardCoursePage({ params }: DashboardCoursePageProps) {
  const { slug } = await params;
  const user = await getSessionUser();

  if (!user) notFound();

  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true },
  });

  if (!course) notFound();

  const access = await checkCourseAccess(user.id, course.id);

  if (!access.granted) notFound();

  const userTier = await getUserTier(user.id);
  const lessonFilter = userTier === "pro" ? {} : { is_pro_only: false };

  const lessons = await prisma.lesson.findMany({
    where: { course_id: course.id, ...lessonFilter },
    orderBy: { sort_order: "asc" },
    select: { id: true, title: true, course_id: true, duration_minutes: true },
  });

  // Fetch completed lesson IDs
  const completedProgress = await prisma.lessonProgress.findMany({
    where: { user_id: user.id, course_id: course.id, is_completed: true },
    select: { lesson_id: true },
  });
  const completedLessonIds = completedProgress.map((p) => p.lesson_id);

  // Compute completion percentage
  const totalLessons = lessons.length;
  const completedCount = completedLessonIds.length;
  const completionPct = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  // Fetch existing course review if eligible
  let existingReview: { rating: number; comment: string } | null = null;
  if (completionPct >= 70) {
    const review = await prisma.courseReview.findUnique({
      where: { user_id_course_id: { user_id: user.id, course_id: course.id } },
      select: { rating: true, comment: true },
    });
    existingReview = review;
  }

  const playerLessons = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    courseId: lesson.course_id,
    durationMinutes: lesson.duration_minutes,
  }));

  return (
    <div>
      <Link
        href="/dashboard/cursos"
        className="group mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Mis cursos
      </Link>
      <h2 className="text-xl font-semibold tracking-tight">{course.title}</h2>
      <p className="mt-1 text-sm text-slate-500">
        Selecciona una leccion y presiona play para reproducir.
        {(() => {
          const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);
          if (totalMinutes === 0) return null;
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? ` ${mins}min` : ""}` : `${mins}min`;
          return <> — Duracion total: {durationStr}</>;
        })()}
      </p>

      {/* Progress bar */}
      {totalLessons > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{completedCount}/{totalLessons} lecciones completadas</span>
            <span>{Math.round(completionPct)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-emerald-500/60 transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        <SecureCoursePlayer lessons={playerLessons} completedLessonIds={completedLessonIds} />
      </div>

      {/* Course review section — shown when >= 70% complete */}
      {completionPct >= 70 && (
        <div className="mt-6">
          <CourseReviewSection courseId={course.id} existingReview={existingReview} />
        </div>
      )}
    </div>
  );
}
