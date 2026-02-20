"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarRating } from "@/components/ui/star-rating";

interface TestimonialPromptProps {
  open: boolean;
}

export function TestimonialPrompt({ open }: TestimonialPromptProps) {
  const [visible, setVisible] = useState(open);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (rating < 1 || content.trim().length === 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content: content.trim() }),
      });
      setSubmitted(true);
      setTimeout(() => setVisible(false), 1500);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDismiss() {
    setVisible(false);
    await fetch("/api/testimonials/dismiss", { method: "POST" });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />

          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-t-2xl border border-white/10 bg-slate-900/95 p-6 backdrop-blur-xl sm:rounded-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 text-slate-500 transition hover:text-slate-300"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            {submitted ? (
              <div className="py-4 text-center">
                <p className="text-lg font-semibold text-emerald-400">Gracias!</p>
                <p className="mt-1 text-sm text-slate-400">Tu testimonio será revisado pronto.</p>
              </div>
            ) : (
              <>
                <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-500">
                  Tu opinión importa
                </p>
                <p className="mt-1 text-center text-sm font-semibold text-white">
                  ¿Cómo ha sido tu experiencia?
                </p>

                <div className="mt-5 flex justify-center">
                  <StarRating value={rating} onChange={setRating} />
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 500))}
                  placeholder="Cuéntanos tu experiencia (máx 500 caracteres)"
                  rows={3}
                  className="mt-4 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400/30"
                />
                <p className="mt-1 text-right text-[10px] text-slate-600">{content.length}/500</p>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5"
                  >
                    Ahora no
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={rating < 1 || content.trim().length === 0 || submitting}
                    className="flex-1 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-40"
                  >
                    {submitting ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
