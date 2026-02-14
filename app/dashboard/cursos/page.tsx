import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { TierBadge } from "@/components/courses/tier-badge";

export default async function DashboardCoursesPage() {
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  let courses: { id: string; title: string; slug: string; subtitle: string | null; tier_access: string }[] = [];
  if (currentTier) {
    const tierFilter = currentTier === "pro" ? {} : { tier_access: "basic" };
    courses = await prisma.course.findMany({
      where: { is_published: true, is_coming_soon: false, ...tierFilter },
      select: { id: true, title: true, slug: true, subtitle: true, tier_access: true },
      orderBy: { title: "asc" },
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Mis cursos</h2>
        {currentTier && (
          <p className="mt-1 text-sm text-slate-500">
            Plan activo:{" "}
            <span className={currentTier === "pro" ? "font-medium text-amber-300" : "font-medium text-slate-300"}>
              {currentTier === "pro" ? "Pro" : "Basic"}
            </span>
          </p>
        )}
      </div>

      {courses.length > 0 ? (
        <div className="space-y-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/cursos/${course.slug}`} className="block">
              <Card className="group relative overflow-hidden p-5 transition-all duration-200 hover:border-emerald-400/15 hover:shadow-[0_0_20px_rgba(52,211,153,0.04)]">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="truncate text-sm font-semibold text-slate-200 transition-colors group-hover:text-white">
                        {course.title}
                      </h3>
                      <TierBadge tier={course.tier_access} />
                    </div>
                    {course.subtitle && (
                      <p className="mt-1 truncate text-xs text-slate-500">{course.subtitle}</p>
                    )}
                  </div>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-slate-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-400">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-slate-600">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">
              {currentTier ? "No hay cursos disponibles aun." : "Necesitas un plan para acceder a los cursos."}
            </p>
            <Link
              href="/planes"
              className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-all duration-200 hover:border-emerald-400/30 hover:bg-emerald-500/15"
            >
              Ver planes
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
