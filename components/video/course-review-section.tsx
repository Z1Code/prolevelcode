"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/star-rating";

interface ExistingReview {
  rating: number;
  comment: string;
}

interface CourseReviewSectionProps {
  courseId: string;
  existingReview: ExistingReview | null;
}

export function CourseReviewSection({ courseId, existingReview }: CourseReviewSectionProps) {
  const [editing, setEditing] = useState(!existingReview);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(!!existingReview);

  async function handleSubmit() {
    if (rating < 1 || !comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, rating, comment }),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="liquid-surface p-5">
      <h3 className="text-sm font-semibold text-white">Tu opinion</h3>
      <p className="mt-1 text-xs text-slate-500">Completaste mas del 70% del curso. Dejanos tu opinion.</p>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1 text-xs text-slate-400">Calificacion</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Escribe tu opinion (requerido, max 500 caracteres)"
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400/30"
            />
            <p className="mt-0.5 text-right text-[10px] text-slate-600">{comment.length}/500</p>
          </div>
          <div className="flex gap-3">
            {saved && (
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={rating < 1 || !comment.trim() || submitting}
              className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-40"
            >
              {submitting ? "Guardando..." : "Enviar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <StarRating value={rating} readOnly size="sm" />
          <p className="mt-2 text-sm text-slate-300">{comment}</p>
          <button
            onClick={() => setEditing(true)}
            className="mt-3 text-xs text-emerald-400 transition hover:text-emerald-300"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
}
