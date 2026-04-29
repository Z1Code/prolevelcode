"use client";

import { useState } from "react";
import { BunnyUploader } from "@/components/admin/bunny-uploader";

interface ShowcaseVideoFormProps {
  projectId: string;
  action: (fd: FormData) => void;
}

export function ShowcaseVideoForm({ projectId, action }: ShowcaseVideoFormProps) {
  const [bunnyVideoId, setBunnyVideoId] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");

  return (
    <form action={action} className="grid gap-3 rounded-lg border border-dashed border-white/10 p-4 sm:grid-cols-2">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="bunny_video_id" value={bunnyVideoId} />
      <input type="hidden" name="duration_minutes" value={duration} />

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Título del video *</span>
        <input
          name="title"
          required
          placeholder="Parte 1 — Setup del proyecto"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Descripción (opcional)</span>
        <input
          name="description"
          placeholder="Instalación, configuración inicial..."
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
        />
      </label>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-slate-400">Video</span>
        {bunnyVideoId ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-300">✓ Video listo</span>
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300">
              {bunnyVideoId}
            </span>
            {duration && (
              <span className="text-xs text-slate-500">{duration} min</span>
            )}
            <button
              type="button"
              onClick={() => { setBunnyVideoId(""); setDuration(""); }}
              className="text-[10px] text-red-400 hover:text-red-300"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <BunnyUploader
            videoTitle={title || undefined}
            onUploadComplete={(id) => setBunnyVideoId(id)}
            onDurationDetected={(mins) => setDuration(String(mins))}
          />
        )}
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={!bunnyVideoId || !title}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Agregar video
        </button>
      </div>
    </form>
  );
}
