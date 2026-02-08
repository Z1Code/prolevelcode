import { Card } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface DashboardEnrollmentRow {
  id: string;
  courses: {
    title: string | null;
    slug: string | null;
  } | null;
}

export default async function DashboardHomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,course_id,status,enrolled_at,courses(title,slug)")
    .eq("user_id", user?.id ?? "")
    .eq("status", "active")
    .order("enrolled_at", { ascending: false });

  const typedEnrollments = (enrollments ?? []) as unknown as DashboardEnrollmentRow[];

  const { count: completedLessons } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user?.id ?? "")
    .eq("is_completed", true);

  return (
    <div>
      <h2 className="text-2xl font-semibold">Resumen</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-400">Cursos activos</p>
          <p className="mt-2 text-2xl font-semibold">{typedEnrollments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Lecciones completadas</p>
          <p className="mt-2 text-2xl font-semibold">{completedLessons ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Estado</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">Activo</p>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <h3 className="font-semibold">Cursos comprados</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {typedEnrollments.map((item) => (
            <li key={item.id}>{item.courses?.title ?? "Curso"}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
