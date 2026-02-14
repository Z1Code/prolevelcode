import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/components/admin/course-form";
import { updateCourse, deleteCourse } from "../../../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: Props) {
  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <div>
      <Link href={`/admin/cursos/${id}`} className="mb-3 inline-flex text-xs text-slate-400 hover:text-slate-200">← Volver al curso</Link>
      <h2 className="text-2xl font-semibold">Editar curso</h2>
      <Card className="mt-4 p-4">
        <CourseForm
          action={updateCourse}
          course={{
            id: course.id,
            title: course.title,
            slug: course.slug,
            subtitle: course.subtitle,
            description: course.description,
            difficulty: course.difficulty,
            category: course.category,
            preview_video_url: course.preview_video_url,
            is_published: course.is_published,
            is_featured: course.is_featured,
            is_coming_soon: course.is_coming_soon,
            tier_access: course.tier_access,
          }}
          submitLabel="Guardar cambios"
        />
      </Card>

      <Card className="mt-4 p-4">
        <p className="text-sm font-medium text-red-400">Zona peligrosa</p>
        <p className="mt-1 text-xs text-slate-400">Eliminar este curso borrara todos los modulos, lecciones y matriculas asociadas.</p>
        <form action={deleteCourse} className="mt-3">
          <input type="hidden" name="id" value={course.id} />
          <Button type="submit" variant="danger" size="sm">Eliminar curso</Button>
        </form>
      </Card>
    </div>
  );
}
