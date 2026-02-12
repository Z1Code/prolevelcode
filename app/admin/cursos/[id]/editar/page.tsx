import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
        <form action={updateCourse} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={course.id} />
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Titulo *</span>
            <Input name="title" defaultValue={course.title} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Slug</span>
            <Input name="slug" defaultValue={course.slug} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Subtitulo</span>
            <Input name="subtitle" defaultValue={course.subtitle ?? ""} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Categoria</span>
            <Input name="category" defaultValue={course.category ?? ""} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Precio (USD)</span>
            <Input name="price_dollars" type="number" step="0.01" min="0" defaultValue={(course.price_cents / 100).toFixed(2)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Moneda</span>
            <Input name="currency" defaultValue={course.currency} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Dificultad</span>
            <Input name="difficulty" defaultValue={course.difficulty ?? ""} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Preview Video (YouTube ID)</span>
            <Input name="preview_video_url" defaultValue={course.preview_video_url ?? ""} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Tier de acceso</span>
            <select name="tier_access" className="liquid-field h-11 w-full rounded-xl px-4 text-sm text-white outline-none" defaultValue={course.tier_access}>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="is_published" defaultChecked={course.is_published} className="h-4 w-4 accent-emerald-400" />
              Publicado
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="is_featured" defaultChecked={course.is_featured} className="h-4 w-4 accent-emerald-400" />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="is_coming_soon" defaultChecked={course.is_coming_soon} className="h-4 w-4 accent-amber-400" />
              Proximamente
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Descripcion</span>
              <Textarea name="description" defaultValue={course.description ?? ""} />
            </label>
          </div>
          <div className="md:col-span-2 flex gap-3">
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
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
