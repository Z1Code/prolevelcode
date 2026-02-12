import Link from "next/link";
import { notFound } from "next/navigation";
import { SecureCoursePlayer } from "@/components/video/secure-course-player";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { checkCourseAccess } from "@/lib/access/check-access";

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

  const lessons = await prisma.lesson.findMany({
    where: { course_id: course.id },
    orderBy: { sort_order: "asc" },
    select: { id: true, title: true, course_id: true },
  });

  const playerLessons = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    courseId: lesson.course_id,
  }));

  return (
    <div>
      <Link href="/dashboard/cursos" className="mb-3 inline-flex text-xs text-slate-400 hover:text-slate-200">← Mis cursos</Link>
      <h2 className="text-2xl font-semibold">{course.title}</h2>
      <p className="mt-2 text-sm text-slate-400">Reproduccion segura con token auto-destruible.</p>
      <div className="mt-4">
        <SecureCoursePlayer lessons={playerLessons} />
      </div>
    </div>
  );
}
