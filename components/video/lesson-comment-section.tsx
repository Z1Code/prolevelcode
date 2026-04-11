"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CommentUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: CommentUser;
}

interface LessonCommentSectionProps {
  lessonId: string;
  courseId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Hace ${days}d`;
  const months = Math.floor(days / 30);
  return `Hace ${months}mes${months > 1 ? "es" : ""}`;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const commentVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.97 },
};

const skeletonLines = [72, 88, 60];

export function LessonCommentSection({ lessonId, courseId }: LessonCommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async (cursor?: string) => {
    const url = `/api/lessons/${lessonId}/comments${cursor ? `?cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    return data as { comments: Comment[]; nextCursor: string | null };
  }, [lessonId]);

  useEffect(() => {
    setComments([]);
    setNextCursor(null);
    setLoading(true);
    setContent("");
    fetchComments().then((data) => {
      if (data) {
        setComments(data.comments);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    });
  }, [fetchComments]);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchComments(nextCursor);
    if (data) {
      setComments((prev) => [...prev, ...data.comments]);
      setNextCursor(data.nextCursor);
    }
    setLoadingMore(false);
  }

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const res = await fetch(`/api/lessons/${lessonId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, courseId }),
    });

    if (res.ok) {
      const newComment: Comment = await res.json();
      setComments((prev) => [newComment, ...prev]);
      setContent("");
    }
    setSubmitting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="liquid-surface mt-4 p-4"
    >
      <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-slate-500">
        Comentarios
      </p>

      {/* Input area */}
      <div className="mb-4">
        <div className={`rounded-lg border transition-all duration-300 ${
          focused
            ? "border-emerald-400/30 shadow-[0_0_16px_rgba(52,211,153,0.06)]"
            : "border-white/[0.06]"
        }`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Escribe un comentario..."
            rows={2}
            className="w-full resize-none rounded-t-lg border-0 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none"
          />
          <div className="flex items-center justify-between rounded-b-lg bg-white/[0.02] px-3 py-1.5">
            <span className={`text-[10px] transition-colors duration-200 ${
              content.length > 450 ? "text-amber-400" : "text-slate-600"
            }`}>
              {content.length > 0 ? `${content.length}/500` : "Ctrl+Enter para enviar"}
            </span>
            <motion.button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-30"
            >
              {submitting ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-emerald-300/30 border-t-emerald-300" />
              ) : (
                "Comentar"
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        /* Skeleton loading */
        <div className="space-y-4 py-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06]" style={{ animation: "skeletonPulse 1.8s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
              <div className="flex-1 space-y-2">
                <div className="skeleton-line w-24" style={{ animationDelay: `${i * 0.15}s` }} />
                <div className="skeleton-line" style={{ width: `${skeletonLines[i]}%`, animationDelay: `${i * 0.15 + 0.1}s` }} />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="py-4 text-center text-xs text-slate-600"
        >
          Sin comentarios aun. Se el primero.
        </motion.p>
      ) : (
        <AnimatePresence mode="popLayout">
          <ul className="space-y-3">
            {comments.map((c, i) => (
              <motion.li
                key={c.id}
                layout
                variants={commentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{
                  duration: 0.35,
                  delay: i < 20 ? i * 0.04 : 0, // Only stagger initial load
                  ease: [0.25, 0.46, 0.45, 0.94],
                  layout: { duration: 0.3 },
                }}
                className="flex gap-3"
              >
                {/* Avatar */}
                {c.user.avatar_url ? (
                  <img
                    src={c.user.avatar_url}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/[0.06]"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/[0.08] to-white/[0.03] text-[10px] font-semibold text-slate-400 ring-1 ring-white/[0.06]">
                    {getInitials(c.user.full_name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-xs font-medium text-slate-300">
                      {c.user.full_name ?? "Usuario"}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-600">
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed text-slate-400">
                    {c.content}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
      )}

      {/* Load more */}
      {nextCursor && (
        <motion.button
          onClick={handleLoadMore}
          disabled={loadingMore}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="mt-3 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-xs text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-400 disabled:opacity-40"
        >
          {loadingMore ? (
            <span className="inline-flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border border-slate-500/30 border-t-slate-400" />
              Cargando...
            </span>
          ) : (
            "Cargar mas"
          )}
        </motion.button>
      )}
    </motion.div>
  );
}
