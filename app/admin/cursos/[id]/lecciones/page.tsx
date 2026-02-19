import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createLesson, updateLesson, deleteLesson, toggleCoursePublished } from "../../../actions";
import { LessonFormWithUpload } from "@/components/admin/lesson-form-with-upload";
import { BulkVideoUploader } from "@/components/admin/bulk-video-uploader";

interface AdminLessonsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLessonsPage({ params }: AdminLessonsPageProps) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, title: true, is_published: true, tier_access: true },
  });

  if (!course) notFound();

  const lessons = await prisma.lesson.findMany({
    where: { course_id: id },
    orderBy: { sort_order: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/cursos" className="text-xs text-slate-400 hover:text-slate-200">← Volver a cursos</Link>
          <h2 className="text-2xl font-semibold">Lecciones: {course.title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Tier: <span className={course.tier_access === "pro" ? "text-amber-300" : "text-slate-300"}>{course.tier_access.toUpperCase()}</span>
            {" · "}
            {course.is_published ? <span className="text-emerald-300">Publicado</span> : <span className="text-amber-300">Borrador</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={toggleCoursePublished}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant={course.is_published ? "ghost" : "primary"} size="sm">
              {course.is_published ? "Despublicar" : "Publicar"}
            </Button>
          </form>
          <Link href={`/admin/cursos/${id}/editar`} className="liquid-surface-soft px-3 py-2 text-xs">
            Editar
          </Link>
        </div>
      </div>

      {/* Existing lessons */}
      <Card className="mt-4 p-4">
        <h3 className="font-semibold">Lecciones ({lessons.length})</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="liquid-surface-soft rounded-lg p-3">
              <form action={updateLesson} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="id" value={lesson.id} />
                <input type="hidden" name="course_id" value={id} />
                <div>
                  <span className="text-xs text-slate-500">Titulo</span>
                  <Input name="title" defaultValue={lesson.title} className="mt-0.5 h-9 text-xs" required />
                </div>
                <div>
                  <span className="text-xs text-slate-500">Bunny Video ID</span>
                  <Input name="bunny_video_id" defaultValue={lesson.bunny_video_id ?? ""} className="mt-0.5 h-9 text-xs" placeholder="GUID de Bunny" />
                </div>
                <div>
                  <span className="text-xs text-slate-500">Min</span>
                  <Input name="duration_minutes" type="number" defaultValue={lesson.duration_minutes ?? ""} className="mt-0.5 h-9 w-20 text-xs" />
                </div>
                <div className="flex items-center gap-3 md:col-span-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300">
                    <input type="checkbox" name="is_free_preview" defaultChecked={lesson.is_free_preview} className="h-3.5 w-3.5 accent-emerald-400" />
                    Preview gratuito
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300">
                    <input type="checkbox" name="is_pro_only" defaultChecked={lesson.is_pro_only} className="h-3.5 w-3.5 accent-violet-400" />
                    Solo Pro
                  </label>
                  <span className="text-xs text-slate-500">#{lesson.sort_order}</span>
                  <div className="ml-auto flex gap-2">
                    <Button type="submit" variant="ghost" size="sm">Guardar</Button>
                  </div>
                </div>
              </form>
              <form action={deleteLesson} className="mt-1 flex justify-end">
                <input type="hidden" name="id" value={lesson.id} />
                <input type="hidden" name="course_id" value={id} />
                <Button type="submit" variant="danger" size="sm">Eliminar</Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>

      {/* Bulk upload */}
      <Card className="mt-4 p-4">
        <h3 className="font-semibold">Subida masiva de videos</h3>
        <p className="mt-1 text-xs text-slate-400">
          Arrastra multiples videos para crear lecciones en lote.
        </p>
        <div className="mt-3">
          <BulkVideoUploader courseId={id} />
        </div>
      </Card>

      {/* Add single lesson with Bunny upload */}
      <Card className="mt-4 p-4">
        <h3 className="font-semibold">Agregar leccion individual</h3>
        <LessonFormWithUpload courseId={id} action={createLesson} />
      </Card>
    </div>
  );
}
