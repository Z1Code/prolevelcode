import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createLesson, updateLesson, deleteLesson } from "../../../actions";

interface AdminLessonsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLessonsPage({ params }: AdminLessonsPageProps) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!course) notFound();

  const modules = await prisma.module.findMany({
    where: { course_id: id },
    orderBy: { sort_order: "asc" },
    select: { id: true, title: true, sort_order: true },
  });

  const lessons = await prisma.lesson.findMany({
    where: { course_id: id },
    orderBy: { sort_order: "asc" },
    include: { module: { select: { title: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/admin/cursos/${id}`} className="text-xs text-slate-400 hover:text-slate-200">← Volver al curso</Link>
          <h2 className="text-2xl font-semibold">Lecciones: {course.title}</h2>
        </div>
      </div>

      {/* Existing lessons */}
      <Card className="mt-4 p-4">
        <h3 className="font-semibold">Lecciones ({lessons.length})</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="liquid-surface-soft rounded-lg p-3">
              <form action={updateLesson} className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
                <input type="hidden" name="id" value={lesson.id} />
                <input type="hidden" name="course_id" value={id} />
                <div>
                  <span className="text-xs text-slate-500">Titulo</span>
                  <Input name="title" defaultValue={lesson.title} className="mt-0.5 h-9 text-xs" required />
                </div>
                <div>
                  <span className="text-xs text-slate-500">YouTube ID</span>
                  <Input name="youtube_video_id" defaultValue={lesson.youtube_video_id} className="mt-0.5 h-9 text-xs" required />
                </div>
                <div>
                  <span className="text-xs text-slate-500">Modulo</span>
                  <select
                    name="module_id"
                    defaultValue={lesson.module_id}
                    className="liquid-field mt-0.5 h-9 w-full rounded-xl px-3 text-xs text-white outline-none"
                  >
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>#{m.sort_order} {m.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Min</span>
                  <Input name="duration_minutes" type="number" defaultValue={lesson.duration_minutes ?? ""} className="mt-0.5 h-9 w-20 text-xs" />
                </div>
                <div className="flex items-center gap-3 md:col-span-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300">
                    <input type="checkbox" name="is_free_preview" defaultChecked={lesson.is_free_preview} className="h-3.5 w-3.5 accent-emerald-400" />
                    Preview gratuito
                  </label>
                  <span className="text-xs text-slate-500">#{lesson.sort_order} &middot; {lesson.module?.title ?? "Sin modulo"}</span>
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

      {/* Add lesson */}
      <Card className="mt-4 p-4">
        <h3 className="font-semibold">Agregar leccion</h3>
        <form action={createLesson} className="mt-3 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="course_id" value={id} />
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Titulo *</span>
            <Input name="title" placeholder="Introduccion a React" required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">YouTube Video ID *</span>
            <Input name="youtube_video_id" placeholder="dQw4w9WgXcQ" required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Modulo</span>
            <select
              name="module_id"
              className="liquid-field h-11 w-full rounded-xl px-4 text-sm text-white outline-none"
              required
            >
              <option value="">Seleccionar modulo</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>#{m.sort_order} {m.title}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Duracion (minutos)</span>
            <Input name="duration_minutes" type="number" placeholder="15" />
          </label>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="is_free_preview" className="h-4 w-4 accent-emerald-400" />
              Preview gratuito
            </label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Agregar leccion</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
