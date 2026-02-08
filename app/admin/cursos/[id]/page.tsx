import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createModule, updateModule, deleteModule } from "../../actions";

interface AdminCourseDetailProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCourseDetailPage({ params }: AdminCourseDetailProps) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, subtitle: true, is_published: true, price_cents: true, currency: true },
  });

  if (!course) notFound();

  const modules = await prisma.module.findMany({
    where: { course_id: id },
    orderBy: { sort_order: "asc" },
    select: { id: true, title: true, sort_order: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{course.title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {course.slug} &middot; ${(course.price_cents / 100).toFixed(2)} {course.currency} &middot; {course.is_published ? "Publicado" : "Borrador"}
          </p>
        </div>
        <Link href={`/admin/cursos/${id}/editar`} className="liquid-surface-soft px-3 py-2 text-sm">
          Editar curso
        </Link>
      </div>

      {/* Modules */}
      <Card className="mt-4 p-4">
        <h3 className="font-semibold">Modulos</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {modules.map((mod) => (
            <li key={mod.id} className="liquid-surface-soft flex items-center justify-between gap-2 rounded-lg p-3">
              <form action={updateModule} className="flex flex-1 items-center gap-2">
                <input type="hidden" name="id" value={mod.id} />
                <input type="hidden" name="course_id" value={id} />
                <span className="w-8 text-center text-xs text-slate-500">#{mod.sort_order}</span>
                <Input name="title" defaultValue={mod.title} className="h-9 text-xs" />
                <Button type="submit" variant="ghost" size="sm">Guardar</Button>
              </form>
              <form action={deleteModule}>
                <input type="hidden" name="id" value={mod.id} />
                <input type="hidden" name="course_id" value={id} />
                <Button type="submit" variant="danger" size="sm">X</Button>
              </form>
            </li>
          ))}
        </ul>

        {/* Add module */}
        <form action={createModule} className="mt-4 flex items-end gap-2">
          <input type="hidden" name="course_id" value={id} />
          <div className="flex-1">
            <span className="text-xs text-slate-400">Nuevo modulo</span>
            <Input name="title" placeholder="Nombre del modulo" className="mt-1" required />
          </div>
          <Button type="submit" size="sm">Agregar</Button>
        </form>
      </Card>

      <div className="mt-4">
        <Link href={`/admin/cursos/${id}/lecciones`} className="liquid-link inline-flex text-sm">
          Gestionar lecciones →
        </Link>
      </div>
    </div>
  );
}
