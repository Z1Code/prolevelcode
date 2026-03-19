"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BunnyUploader } from "./bunny-uploader";

interface LessonFormWithUploadProps {
  courseId: string;
  tierAccess?: string;
  action: (fd: FormData) => void;
}

export function LessonFormWithUpload({ courseId, tierAccess, action }: LessonFormWithUploadProps) {
  const [bunnyVideoId, setBunnyVideoId] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");

  return (
    <form action={action} className="mt-3 grid gap-3 md:grid-cols-2">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="bunny_video_id" value={bunnyVideoId} />

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Titulo *</span>
        <Input
          name="title"
          placeholder="Introduccion a React"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <div className="flex flex-col justify-end gap-1">
        <input type="hidden" name="duration_minutes" value={duration} />
        {duration ? (
          <span className="text-xs text-emerald-400/70">{duration} min — auto-detectado</span>
        ) : (
          <span className="text-xs text-slate-500">Duracion se detecta al subir video</span>
        )}
      </div>

      <div className="md:col-span-2">
        <span className="text-xs text-slate-400">Video</span>
        {bunnyVideoId ? (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-emerald-300">Video listo</span>
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300">{bunnyVideoId}</span>
            <button
              type="button"
              onClick={() => setBunnyVideoId("")}
              className="text-[10px] text-red-400 hover:text-red-300"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="mt-1">
            <BunnyUploader
              videoTitle={title || undefined}
              onUploadComplete={(id) => setBunnyVideoId(id)}
              onDurationDetected={(mins) => setDuration(String(mins))}
            />
          </div>
        )}
      </div>

      {tierAccess === "pro" && <input type="hidden" name="is_pro_only" value="on" />}
      <div className="flex items-center gap-4 md:col-span-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="is_free_preview" className="h-4 w-4 accent-emerald-400" />
          Preview gratuito
        </label>
      </div>

      <div className="md:col-span-2">
        <Button type="submit" disabled={!bunnyVideoId}>Agregar leccion</Button>
      </div>
    </form>
  );
}
