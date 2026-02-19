import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BASIC_MODULES, PRO_MODULES } from "@/lib/courses/curriculum";
import { CurriculumIcon } from "@/components/courses/curriculum-icon";
import { openCurriculumModule } from "../actions";
import { Button } from "@/components/ui/button";

export default async function AdminCoursesPage() {
  // Fetch all courses to match against curriculum modules
  const courses = await prisma.course.findMany({
    select: { id: true, slug: true, is_published: true, total_lessons: true },
  });
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Cursos</h2>
          <p className="mt-1 text-sm text-slate-400">
            Selecciona un modulo para gestionar sus lecciones
          </p>
        </div>
        <Link className="liquid-surface-soft px-3 py-2 text-sm" href="/admin/cursos/new">
          Nuevo curso libre
        </Link>
      </div>

      {/* Basic Tier */}
      <div className="mt-8">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="rounded-full border border-slate-300/20 bg-slate-300/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300">
            BASIC
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BASIC_MODULES.map((mod) => {
            const course = courseBySlug.get(mod.defaultSlug);
            return (
              <form key={mod.key} action={openCurriculumModule}>
                <input type="hidden" name="module_key" value={mod.key} />
                <input type="hidden" name="default_slug" value={mod.defaultSlug} />
                <input type="hidden" name="title" value={mod.title} />
                <input type="hidden" name="tier" value={mod.tier} />
                <button
                  type="submit"
                  className="group relative w-full overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 text-left transition-all duration-200 hover:border-emerald-400/20 hover:bg-white/[0.05] hover:shadow-[0_0_24px_rgba(52,211,153,0.06)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/15">
                        <CurriculumIcon icon={mod.icon} />
                      </div>
                      <div className="flex items-center gap-2">
                        {course ? (
                          <>
                            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              {course.total_lessons ?? 0} lecciones
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${course.is_published ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                              {course.is_published ? "Publicado" : "Borrador"}
                            </span>
                          </>
                        ) : (
                          <span className="rounded-full border border-slate-500/20 bg-slate-600/10 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Sin crear
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 transition-colors group-hover:text-white">
                      {mod.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {mod.description}
                    </p>
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      </div>

      {/* Pro Tier */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="rounded-full border border-amber-400/25 bg-gradient-to-r from-amber-500/15 via-yellow-400/15 to-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.1)]">
            PRO
          </span>
          <div className="h-px flex-1 bg-amber-400/[0.08]" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRO_MODULES.map((mod) => {
            const course = courseBySlug.get(mod.defaultSlug);
            return (
              <form key={mod.key} action={openCurriculumModule}>
                <input type="hidden" name="module_key" value={mod.key} />
                <input type="hidden" name="default_slug" value={mod.defaultSlug} />
                <input type="hidden" name="title" value={mod.title} />
                <input type="hidden" name="tier" value={mod.tier} />
                <button
                  type="submit"
                  className="group relative w-full overflow-hidden rounded-xl border border-amber-400/[0.12] bg-gradient-to-br from-amber-500/[0.04] via-white/[0.02] to-transparent p-5 text-left transition-all duration-200 hover:border-amber-400/25 hover:shadow-[0_0_24px_rgba(251,191,36,0.08)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 transition-colors group-hover:bg-amber-500/15">
                        <CurriculumIcon icon={mod.icon} />
                      </div>
                      <div className="flex items-center gap-2">
                        {course ? (
                          <>
                            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              {course.total_lessons ?? 0} lecciones
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${course.is_published ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                              {course.is_published ? "Publicado" : "Borrador"}
                            </span>
                          </>
                        ) : (
                          <span className="rounded-full border border-amber-400/15 bg-amber-500/[0.06] px-2 py-0.5 text-[10px] font-medium text-amber-400/50">
                            Sin crear
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-amber-200 transition-colors group-hover:text-amber-100">
                      {mod.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-amber-400/40">
                      {mod.description}
                    </p>
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      </div>

      {/* Legacy table for any courses not in curriculum */}
      {(() => {
        const curriculumSlugs = new Set([...BASIC_MODULES, ...PRO_MODULES].map((m) => m.defaultSlug));
        const orphanCourses = courses.filter((c) => !curriculumSlugs.has(c.slug));
        if (orphanCourses.length === 0) return null;
        return (
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="rounded-full border border-slate-500/20 bg-slate-600/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-500">
                OTROS
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="space-y-2">
              {orphanCourses.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/cursos/${c.id}/lecciones`}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
                >
                  <span className="text-slate-300">{c.slug}</span>
                  <span className="text-xs text-slate-500">{c.total_lessons ?? 0} lecciones</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
