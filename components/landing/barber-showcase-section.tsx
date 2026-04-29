"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";

interface ShowcaseVideo {
  id: string;
  title: string;
  description: string | null;
  bunny_thumbnail_url: string | null;
  duration_minutes: number | null;
  bunny_video_id: string;
}

interface ShowcaseProject {
  id: string;
  title: string;
  description: string | null;
  app_url: string | null;
  tech_tags: string[];
  videos: ShowcaseVideo[];
}

interface Props {
  project: ShowcaseProject;
  isPro: boolean;
  embedUrls: Record<string, string>; // videoId → signed embed URL
}

function formatDuration(mins: number | null): string {
  if (!mins) return "";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function BarberShowcaseSection({ project, isPro, embedUrls }: Props) {
  const [activeVideo, setActiveVideo] = useState<ShowcaseVideo | null>(null);

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section className="section-spacing liquid-section">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium tracking-wider text-violet-300 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Proyecto real — Exclusivo Pro
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {project.title}
          </h2>

          {project.description && (
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
              {project.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {project.tech_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
              >
                {tag}
              </span>
            ))}
            {project.app_url && (
              <a
                href={project.app_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
              >
                Ver app
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </motion.div>

        {/* Videos grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {project.videos.map((video, i) => (
            <motion.div key={video.id} variants={itemVariants}>
              <button
                type="button"
                onClick={() => isPro && setActiveVideo(video)}
                className={`group relative w-full overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                  isPro
                    ? "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.06] cursor-pointer"
                    : "border-white/[0.05] bg-white/[0.02] cursor-default"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-white/5">
                  {video.bunny_thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.bunny_thumbnail_url}
                      alt={video.title}
                      className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        !isPro ? "blur-md" : ""
                      }`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.876v6.248a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Numero de episodio */}
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                    #{String(i + 1).padStart(2, "0")}
                  </span>

                  {isPro ? (
                    /* Play button overlay */
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <svg className="ml-1 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    /* Lock overlay */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-[2px]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
                        <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-medium text-white/60">Solo Pro</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-white leading-snug">{video.title}</p>
                  {video.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{video.description}</p>
                  )}
                  {video.duration_minutes && (
                    <p className="mt-1.5 text-xs text-slate-600">
                      {formatDuration(video.duration_minutes)}
                    </p>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA para no Pro */}
        {!isPro && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 text-center"
          >
            <p className="mb-4 text-sm text-slate-400">
              Accede a todos los videos del proceso de construcción con una suscripción Pro.
            </p>
            <a
              href="/planes"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-violet-400"
            >
              Ver planes Pro
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </motion.div>
        )}
      </div>

      {/* Video modal */}
      {activeVideo && isPro && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <p className="text-sm font-medium text-white">{activeVideo.title}</p>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={embedUrls[activeVideo.bunny_video_id]}
                className="h-full w-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
