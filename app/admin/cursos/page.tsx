import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";

export default async function AdminCoursesPage() {
  const supabase = createAdminSupabaseClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,slug,is_published,total_lessons,price_cents,currency")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Cursos</h2>
        <Link className="liquid-surface-soft px-3 py-2 text-sm" href="/admin/cursos/new">Nuevo curso</Link>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <table className="liquid-table w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-3">Titulo</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Lecciones</th>
              <th className="px-4 py-3">Publicado</th>
              <th className="px-4 py-3">Accion</th>
            </tr>
          </thead>
          <tbody>
            {courses?.map((course) => (
              <tr key={course.id}>
                <td className="px-4 py-3">{course.title}</td>
                <td className="px-4 py-3">{course.slug}</td>
                <td className="px-4 py-3">{course.total_lessons ?? 0}</td>
                <td className="px-4 py-3">{course.is_published ? "Si" : "No"}</td>
                <td className="px-4 py-3"><Link href={`/admin/cursos/${course.id}`} className="text-emerald-300">Editar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


