import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";

interface AdminCourseDetailProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCourseDetailPage({ params }: AdminCourseDetailProps) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id,title,slug,subtitle,is_published")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id,title,sort_order")
    .eq("course_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h2 className="text-2xl font-semibold">{course.title}</h2>
      <p className="mt-1 text-sm text-slate-400">Slug: {course.slug}</p>

      <Card className="mt-4 p-4">
        <h3 className="font-semibold">Modulos</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {modules?.map((module) => (
            <li key={module.id}>
              #{module.sort_order} - {module.title}
            </li>
          ))}
        </ul>
        <Link href={`/admin/cursos/${id}/lecciones`} className="liquid-link mt-4 inline-flex text-sm">
          Gestionar lecciones
        </Link>
      </Card>
    </div>
  );
}
