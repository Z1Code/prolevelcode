import { notFound } from "next/navigation";
import { SecureCoursePlayer } from "@/components/video/secure-course-player";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface DashboardCoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardCoursePage({ params }: DashboardCoursePageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,course_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const enrolledCourseIds = new Set((enrollments ?? []).map((item) => String(item.course_id)));

  if (enrolledCourseIds.size === 0) {
    notFound();
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id,title,slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!course || !enrolledCourseIds.has(String(course.id))) {
    notFound();
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,course_id,sort_order")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });

  const playerLessons = (lessons ?? []).map((lesson) => ({
    id: String(lesson.id),
    title: String(lesson.title),
    courseId: String(lesson.course_id),
  }));

  return (
    <div>
      <h2 className="text-2xl font-semibold">{String(course.title ?? "Curso")}</h2>
      <p className="mt-2 text-sm text-slate-400">Reproduccion segura con token auto-destruible.</p>
      <div className="mt-4">
        <SecureCoursePlayer lessons={playerLessons} />
      </div>
    </div>
  );
}
