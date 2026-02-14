"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDeviceFingerprint } from "@/lib/tokens/fingerprint";

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
  const [showOverlay, setShowOverlay] = useState(true);
  const fingerprintRef = useRef<string | null>(null);

  const currentLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId],
  );

  useEffect(() => {
    getDeviceFingerprint().then((fp) => {
      fingerprintRef.current = fp;
    });
  }, []);

  async function handlePlay() {
    if (!currentLesson) return;

    setLoading(true);
    setError(null);

    const response = await fetch("/api/tokens/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: currentLesson.id,
        courseId: currentLesson.courseId,
        fingerprint: fingerprintRef.current,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "No se pudo cargar el video");
      setLoading(false);
      return;
    }

    setTokenData(payload);
    setLoading(false);
    // Fade out overlay after a brief moment
    setTimeout(() => setShowOverlay(false), 300);
  }

  function selectLesson(lessonId: string) {
    setSelectedLessonId(lessonId);
    setTokenData(null);
    setError(null);
    setShowOverlay(true);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="liquid-surface p-4">
        <p className="px-1 text-[11px] font-medium uppercase tracking-widest text-slate-500">Lecciones</p>
        <ul className="mt-3 space-y-1.5">
          {lessons.map((lesson, i) => {
            const isActive = selectedLessonId === lesson.id;
            return (
              <li key={lesson.id}>
                <button
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                    isActive
                      ? "border border-emerald-400/25 bg-emerald-500/10 text-white shadow-[0_0_12px_rgba(52,211,153,0.06)]"
                      : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200"
                  }`}
                  onClick={() => selectLesson(lesson.id)}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-400/20 text-emerald-300"
                      : "bg-white/5 text-slate-500 group-hover:text-slate-400"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="truncate">{lesson.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Player area */}
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/40 shadow-2xl shadow-black/40">
          {/* Video container */}
          <div className="relative aspect-video w-full">
            {/* Iframe (loads behind overlay) */}
            {tokenData && (
              <iframe
                src={tokenData.videoUrl}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

            {/* Play overlay */}
            <AnimatePresence>
              {showOverlay && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-black/70 via-black/50 to-black/70"
                >
                  {/* Decorative rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-40 w-40 rounded-full border border-white/[0.04]" />
                    <div className="absolute h-56 w-56 rounded-full border border-white/[0.02]" />
                  </div>

                  {/* Lesson title */}
                  <p className="relative mb-6 max-w-md text-center text-sm font-medium text-slate-300">
                    {currentLesson?.title ?? "Selecciona una leccion"}
                  </p>

                  {/* Play button */}
                  <button
                    onClick={handlePlay}
                    disabled={loading || !currentLesson}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:shadow-[0_0_30px_rgba(52,211,153,0.12)] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="ml-1 h-8 w-8 text-white/80 transition-colors group-hover:text-emerald-300"
                      >
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info bar */}
        <AnimatePresence>
          {tokenData && !showOverlay && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500"
            >
              <span>{currentLesson?.title}</span>
              <span>Vistas restantes: {tokenData.remainingViews}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
