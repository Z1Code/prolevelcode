"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface LessonOption {
  id: string;
  title: string;
  courseId: string;
}

interface TokenPayload {
  token: string;
  videoUrl: string;
  expiresAt: string;
  remainingViews: number;
}

export function SecureCoursePlayer({ lessons }: { lessons: LessonOption[] }) {
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? "");
  const [tokenData, setTokenData] = useState<TokenPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId],
  );

  async function generateToken() {
    if (!currentLesson) return;

    setLoading(true);
    setError(null);

    const response = await fetch("/api/tokens/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: currentLesson.id, courseId: currentLesson.courseId }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "No se pudo generar token");
      setLoading(false);
      return;
    }

    setTokenData(payload);
    setLoading(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="liquid-surface p-4">
        <h3 className="font-semibold">Lecciones</h3>
        <ul className="mt-3 space-y-2">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <button
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selectedLessonId === lesson.id
                    ? "border-emerald-300/40 bg-emerald-300/10"
                    : "liquid-surface-soft hover:border-white/30"
                }`}
                onClick={() => {
                  setSelectedLessonId(lesson.id);
                  setTokenData(null);
                }}
              >
                {lesson.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="liquid-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{currentLesson?.title ?? "Selecciona leccion"}</h3>
            <p className="text-sm text-slate-400">El video se sirve via token seguro y expira automaticamente.</p>
          </div>
          <Button onClick={generateToken} disabled={loading || !currentLesson}>
            {loading ? "Generando..." : "Generar token"}
          </Button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        {tokenData ? (
          <div className="mt-4">
            <iframe
              src={tokenData.videoUrl}
              className="aspect-video w-full rounded-xl border border-white/10"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            />
            <p className="mt-2 text-xs text-slate-400">
              Expira: {new Date(tokenData.expiresAt).toLocaleString("es-ES")} - Vistas restantes:{" "}
              {tokenData.remainingViews}
            </p>
          </div>
        ) : (
          <div className="liquid-surface-soft mt-4 aspect-video rounded-xl border border-dashed border-white/20" />
        )}
      </div>
    </div>
  );
}
