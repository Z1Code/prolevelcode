"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarRating } from "@/components/ui/star-rating";

interface LessonReviewModalProps {
  open: boolean;
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  onClose: () => void;
}

export function LessonReviewModal({ open, lessonId, courseId, lessonTitle, onClose }: LessonReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      await fetch("/api/lessons/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, courseId, rating, comment: comment || null }),
      });
    } finally {
      setSubmitting(false);
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-t-2xl border border-white/10 bg-slate-900/95 p-6 backdrop-blur-xl sm:rounded-2xl"
          >
            <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-500">
              Leccion completada
            </p>
            <p className="mt-1 text-center text-sm font-semibold text-white">{lessonTitle}</p>

            <div className="mt-5 flex justify-center">
              <StarRating value={rating} onChange={setRating} />
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 280))}
              placeholder="Comentario opcional (280 caracteres)"
              rows={3}
              className="mt-4 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400/30"
            />
            <p className="mt-1 text-right text-[10px] text-slate-600">{comment.length}/280</p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5"
              >
                Saltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating < 1 || submitting}
                className="flex-1 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-40"
              >
                {submitting ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
