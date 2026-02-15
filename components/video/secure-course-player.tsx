"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDeviceFingerprint } from "@/lib/tokens/fingerprint";
import { LessonReviewModal } from "./lesson-review-modal";

interface LessonOption {
  id: string;
  title: string;
  courseId: string;
  durationMinutes?: number | null;
}

interface TokenPayload {
  token: string;
  videoUrl: string;
  expiresAt: string;
  remainingViews: number;
}

interface SecureCoursePlayerProps {
  lessons: LessonOption[];
  completedLessonIds: string[];
}

export function SecureCoursePlayer({ lessons, completedLessonIds }: SecureCoursePlayerProps) {
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? "");
  const [tokenData, setTokenData] = useState<TokenPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedLessonIds));
  const [completing, setCompleting] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ lessonId: string; courseId: string; title: string } | null>(null);
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

  async function handleComplete() {
    if (!currentLesson || completed.has(currentLesson.id)) return;
    setCompleting(true);
    try {
      const res = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: currentLesson.id, courseId: currentLesson.courseId }),
      });
      if (res.ok) {
        setCompleted((prev) => new Set(prev).add(currentLesson.id));
        setReviewModal({
          lessonId: currentLesson.id,
          courseId: currentLesson.courseId,
          title: currentLesson.title,
        });
      }
    } finally {
      setCompleting(false);
    }
  }

  function selectLesson(lessonId: string) {
    setSelectedLessonId(lessonId);
    setTokenData(null);
    setError(null);
    setShowOverlay(true);
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="liquid-surface p-4">
          <p className="px-1 text-[11px] font-medium uppercase tracking-widest text-slate-500">Lecciones</p>
          <ul className="mt-3 space-y-1.5">
            {lessons.map((lesson, i) => {
              const isActive = selectedLessonId === lesson.id;
              const isCompleted = completed.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <button
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                      isActive
                        ? "border border-emerald-400/25 bg-emerald-500/10 text-white shadow-[0_0_12px_rgba(52,211,153,0.06)]"
                        : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200"
                    }`}
                    onClick={() => selectLesson(lesson.id)}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold transition-colors ${
                      isCompleted
                        ? "bg-emerald-400/20 text-emerald-300"
                        : isActive
                          ? "bg-emerald-400/20 text-emerald-300"
                          : "bg-white/5 text-slate-500 group-hover:text-slate-400"
                    }`}>
                      {isCompleted ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                    {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
                      <span className="shrink-0 rounded-md border border-cyan-400/15 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-cyan-300">
                        {lesson.durationMinutes}m
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Player area */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 shadow-2xl shadow-black/40">
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

          {/* Info bar with complete button */}
          <AnimatePresence>
            {tokenData && !showOverlay && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500"
              >
                <span>{currentLesson?.title}</span>
                <div className="flex items-center gap-3">
                  <span>Vistas restantes: {tokenData.remainingViews}</span>
                  {currentLesson && !completed.has(currentLesson.id) && (
                    <button
                      onClick={handleComplete}
                      disabled={completing}
                      className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-40"
                    >
                      {completing ? "Marcando..." : "Marcar como completada"}
                    </button>
                  )}
                  {currentLesson && completed.has(currentLesson.id) && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Completada
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Review modal */}
      {reviewModal && (
        <LessonReviewModal
          open={!!reviewModal}
          lessonId={reviewModal.lessonId}
          courseId={reviewModal.courseId}
          lessonTitle={reviewModal.title}
          onClose={() => setReviewModal(null)}
        />
      )}
    </>
  );
}
