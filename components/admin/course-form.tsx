"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BunnyUploader } from "@/components/admin/bunny-uploader";

interface CourseFormProps {
  action: (fd: FormData) => void;
  course?: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    description: string | null;
    difficulty: string | null;
    category: string | null;
    preview_video_url: string | null;
    is_published: boolean;
    is_featured: boolean;
    is_coming_soon: boolean;
    tier_access: string;
  };
  submitLabel: string;
}

export function CourseForm({ action, course, submitLabel }: CourseFormProps) {
  const [bunnyVideoId, setBunnyVideoId] = useState(course?.preview_video_url ?? "");

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      {course && <input type="hidden" name="id" value={course.id} />}
      <input type="hidden" name="preview_video_url" value={bunnyVideoId} />

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Titulo *</span>
        <Input name="title" placeholder="Titulo del curso" defaultValue={course?.title ?? ""} required />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Slug (auto si vacio)</span>
        <Input name="slug" placeholder="mi-curso" defaultValue={course?.slug ?? ""} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Subtitulo</span>
        <Input name="subtitle" placeholder="Breve subtitulo" defaultValue={course?.subtitle ?? ""} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Categoria</span>
        <Input name="category" placeholder="Ej: Frontend, Backend" defaultValue={course?.category ?? ""} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Dificultad</span>
        <select
          name="difficulty"
          className="liquid-field h-11 w-full rounded-xl px-4 text-sm text-white outline-none"
          defaultValue={course?.difficulty ?? ""}
        >
          <option value="">Seleccionar dificultad</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Tier de acceso</span>
        <select
          name="tier_access"
          className="liquid-field h-11 w-full rounded-xl px-4 text-sm text-white outline-none"
          defaultValue={course?.tier_access ?? "basic"}
        >
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
        </select>
      </label>

      {/* Preview video upload via Bunny */}
      <div className="md:col-span-2 flex flex-col gap-1">
        <span className="text-xs text-slate-400">Video de preview</span>
        {bunnyVideoId ? (
          <div className="flex items-center gap-3">
            <span className="rounded bg-white/10 px-2 py-1 font-mono text-xs text-emerald-300">
              {bunnyVideoId}
            </span>
            <button
              type="button"
              onClick={() => setBunnyVideoId("")}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Cambiar video
            </button>
          </div>
        ) : (
          <BunnyUploader
            onUploadComplete={(videoId) => setBunnyVideoId(videoId)}
            videoTitle={course?.title ?? "preview"}
          />
        )}
      </div>

      <div className="flex items-end gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="is_published" defaultChecked={course?.is_published ?? false} className="h-4 w-4 accent-emerald-400" />
          Publicado
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="is_featured" defaultChecked={course?.is_featured ?? false} className="h-4 w-4 accent-emerald-400" />
          Destacado
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="is_coming_soon" defaultChecked={course?.is_coming_soon ?? false} className="h-4 w-4 accent-amber-400" />
          Proximamente
        </label>
      </div>

      <div className="md:col-span-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Descripcion</span>
          <Textarea name="description" placeholder="Descripcion del curso" defaultValue={course?.description ?? ""} />
        </label>
      </div>
      <div className="md:col-span-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
