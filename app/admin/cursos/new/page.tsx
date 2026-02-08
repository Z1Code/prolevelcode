import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createCourse } from "../../actions";

export default function NewCoursePage() {
  return (
    <div>
      <Link href="/admin/cursos" className="mb-3 inline-flex text-xs text-slate-400 hover:text-slate-200">← Volver a cursos</Link>
      <h2 className="text-2xl font-semibold">Nuevo curso</h2>
      <Card className="mt-4 p-4">
        <form action={createCourse} className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Titulo *</span>
            <Input name="title" placeholder="Titulo del curso" required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Slug (auto si vacio)</span>
            <Input name="slug" placeholder="mi-curso" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Subtitulo</span>
            <Input name="subtitle" placeholder="Breve subtitulo" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Categoria</span>
            <Input name="category" placeholder="Ej: Frontend, Backend" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Precio (USD)</span>
            <Input name="price_dollars" type="number" step="0.01" min="0" placeholder="49.90" defaultValue={0} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Moneda</span>
            <Input name="currency" placeholder="USD" defaultValue="USD" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Dificultad</span>
            <Input name="difficulty" placeholder="Ej: Principiante, Intermedio" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Preview Video (YouTube ID)</span>
            <Input name="preview_video_url" placeholder="dQw4w9WgXcQ" />
          </label>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="is_published" className="h-4 w-4 accent-emerald-400" />
              Publicado
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="is_featured" className="h-4 w-4 accent-emerald-400" />
              Destacado
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Descripcion</span>
              <Textarea name="description" placeholder="Descripcion del curso" />
            </label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Crear curso</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
