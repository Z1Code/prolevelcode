import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  createShowcaseProject,
  addShowcaseVideo,
  deleteShowcaseVideo,
  publishShowcaseProject,
  deleteShowcaseProject,
} from "@/app/admin/actions";
import { ShowcaseVideoForm } from "./video-form";

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  await requireRole(["admin", "superadmin"]);

  const projects = await prisma.showcaseProject.findMany({
    orderBy: { sort_order: "asc" },
    include: {
      videos: { orderBy: { sort_order: "asc" } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Showcase — Proyectos</h2>
        <p className="mt-1 text-sm text-slate-400">
          Proyectos reales que muestras en el landing. Los videos son exclusivos Pro.
        </p>
      </div>

      {/* Crear proyecto */}
      <section className="liquid-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-slate-300">Nuevo proyecto</h3>
        <form action={createShowcaseProject} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Título *</span>
            <input
              name="title"
              required
              placeholder="App de Barbería"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Slug (auto si vacío)</span>
            <input
              name="slug"
              placeholder="app-barberia"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs text-slate-400">Descripción</span>
            <textarea
              name="description"
              rows={2}
              placeholder="App web completa para gestión de citas en barberías..."
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">URL de la app</span>
            <input
              name="app_url"
              type="url"
              placeholder="https://barberia.prolevelcode.com"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Tech tags (separados por coma)</span>
            <input
              name="tech_tags"
              placeholder="Next.js, Prisma, Stripe, Tailwind"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Crear proyecto
            </button>
          </div>
        </form>
      </section>

      {/* Proyectos existentes */}
      {projects.map((project) => (
        <section key={project.id} className="liquid-surface space-y-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{project.title}</h3>
                {project.is_published ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    Publicado
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] text-slate-400">
                    Borrador
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{project.slug}</p>
              {project.tech_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {project.tech_tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <form
                action={async () => {
                  "use server";
                  await publishShowcaseProject(project.id, !project.is_published);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  {project.is_published ? "Despublicar" : "Publicar"}
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteShowcaseProject(project.id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
                  onClick={(e) => {
                    if (!confirm("¿Eliminar este proyecto y todos sus videos?")) e.preventDefault();
                  }}
                >
                  Eliminar
                </button>
              </form>
            </div>
          </div>

          {/* Videos del proyecto */}
          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              Videos ({project.videos.length})
            </h4>
            {project.videos.length > 0 && (
              <div className="mb-4 space-y-2">
                {project.videos.map((video, i) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    {video.bunny_thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.bunny_thumbnail_url}
                        alt=""
                        className="h-10 w-16 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-white">
                        {i + 1}. {video.title}
                      </p>
                      {video.duration_minutes && (
                        <p className="text-xs text-slate-500">{video.duration_minutes} min</p>
                      )}
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await deleteShowcaseVideo(video.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Quitar
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            {/* Agregar video */}
            <ShowcaseVideoForm projectId={project.id} action={addShowcaseVideo} />
          </div>
        </section>
      ))}

      {projects.length === 0 && (
        <p className="text-sm text-slate-500">No hay proyectos aún. Crea uno arriba.</p>
      )}
    </div>
  );
}
