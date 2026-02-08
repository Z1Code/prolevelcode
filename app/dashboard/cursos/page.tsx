import Link from "next/link";
import { Card } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface DashboardCourseEnrollment {
  id: string;
  courses: {
    title: string | null;
    slug: string | null;
    subtitle: string | null;
  } | null;
}

export default async function DashboardCoursesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,course_id,status,courses(title,slug,subtitle)")
    .eq("user_id", user?.id ?? "")
    .eq("status", "active");

  const typedEnrollments = (enrollments ?? []) as unknown as DashboardCourseEnrollment[];

  return (
    <div>
      <h2 className="text-2xl font-semibold">Mis cursos</h2>
      <div className="mt-4 space-y-3">
        {typedEnrollments.map((item) => (
          <Card key={item.id} className="p-4">
            <h3 className="text-lg font-semibold">{item.courses?.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{item.courses?.subtitle}</p>
            <Link href={`/dashboard/cursos/${item.courses?.slug}`} className="mt-3 inline-flex text-sm text-emerald-300">
              Abrir curso
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

