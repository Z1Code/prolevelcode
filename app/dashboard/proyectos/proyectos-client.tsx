"use client";

import { useState } from "react";

interface ShowcaseVideo {
  id: string;
  title: string;
  description: string | null;
  bunny_thumbnail_url: string | null;
  duration_minutes: number | null;
  bunny_video_id: string;
  sort_order: number;
  created_at: string;
}

interface ShowcaseProject {
  id: string;
  title: string;
  description: string | null;
  app_url: string | null;
  tech_tags: string[];
  videos: ShowcaseVideo[];
  created_at: string;
}

interface Props {
  projects: ShowcaseProject[];
  embedUrls: Record<string, string>;
}

function fmt(mins: number | null) {
  if (!mins) return "";
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function ProyectosClient({ projects, embedUrls }: Props) {
  const [activeVideo, setActiveVideo] = useState<ShowcaseVideo | null>(null);
  const [activeProject, setActiveProject] = useState<ShowcaseProject | null>(null);

  function openVideo(video: ShowcaseVideo, project: ShowcaseProject) {
    setActiveVideo(video);
    setActiveProject(project);
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
          </svg>
        </div>
        <p className="text-sm text-slate-400">Próximamente — estamos grabando el proceso.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-10 page-enter">
        {projects.map((project) => (
          <div key={project.id} className="space-y-6">
            {/* Project header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">{project.title}</h2>
                {project.description && (
                  <p className="mt-1 max-w-xl text-sm text-slate-400">{project.description}</p>
                )}
                {project.tech_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.tech_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {project.app_url && (
                <a
                  href={project.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                >
                  Ver app
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>

            {/* Videos grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {project.videos.map((video, i) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => openVideo(video, project)}
                  className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] text-left transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.06]"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-white/5">
                    {video.bunny_thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.bunny_thumbnail_url}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-8 w-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.876v6.248a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Episode number */}
                    <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                      #{String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600/80 shadow-lg backdrop-blur-sm">
                        <svg className="ml-0.5 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium leading-snug text-white">{video.title}</p>
                    {video.description && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{video.description}</p>
                    )}
                    {video.duration_minutes && (
                      <p className="mt-1.5 text-xs text-slate-600">{fmt(video.duration_minutes)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Video modal */}
      {activeVideo && activeProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{activeVideo.title}</p>
                <p className="text-xs text-slate-500">{activeProject.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="ml-4 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Player */}
            <div className="aspect-video w-full bg-black">
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
    </>
  );
}
