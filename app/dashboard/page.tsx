import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";

export default async function DashboardHomePage() {
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  let courseCount = 0;
  if (currentTier) {
    const tierFilter = currentTier === "pro" ? {} : { tier_access: "basic" };
    courseCount = await prisma.course.count({
      where: { is_published: true, is_coming_soon: false, ...tierFilter },
    });
  }

  const completedLessons = user
    ? await prisma.lessonProgress.count({
        where: { user_id: user.id, is_completed: true },
      })
    : 0;

  const stats = [
    {
      label: "Cursos disponibles",
      value: courseCount,
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      ),
      accent: "text-emerald-400",
      glow: "from-emerald-500/10",
    },
    {
      label: "Lecciones completadas",
      value: completedLessons,
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      accent: "text-blue-400",
      glow: "from-blue-500/10",
    },
    {
      label: "Plan activo",
      value: currentTier === "pro" ? "Pro" : currentTier === "basic" ? "Basic" : "---",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5z" clipRule="evenodd" />
        </svg>
      ),
      accent: currentTier === "pro" ? "text-amber-300" : currentTier === "basic" ? "text-slate-300" : "text-slate-600",
      glow: currentTier === "pro" ? "from-amber-500/10" : "from-slate-400/5",
    },
  ];

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-xl font-semibold tracking-tight">Resumen</h2>
        <p className="mt-1 text-sm text-slate-500">Bienvenido de vuelta{user?.email ? `, ${user.email.split("@")[0]}` : ""}.</p>
      </div>

      {/* Stats grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="group relative overflow-hidden p-5">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.glow} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">{stat.label}</p>
                <span className={`${stat.accent} opacity-30`}>{stat.icon}</span>
              </div>
              <p className={`mt-3 text-3xl font-bold tracking-tight ${stat.accent}`}>{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Action card */}
      <Card className="mt-6 p-6">
        {!currentTier ? (
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-400">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">Necesitas un plan activo para acceder a los cursos</p>
              <p className="mt-0.5 text-xs text-slate-500">Elige un plan y desbloquea todo el contenido.</p>
            </div>
            <Link
              href="/planes"
              className="shrink-0 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-all duration-200 hover:border-emerald-400/30 hover:bg-emerald-500/15 hover:shadow-[0_0_20px_rgba(52,211,153,0.08)]"
            >
              Ver planes
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-400">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">Tus cursos</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Tienes acceso a {currentTier === "pro" ? "todos los cursos" : "los cursos Basic"}.
              </p>
            </div>
            <Link
              href="/dashboard/cursos"
              className="shrink-0 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-all duration-200 hover:border-emerald-400/30 hover:bg-emerald-500/15 hover:shadow-[0_0_20px_rgba(52,211,153,0.08)]"
            >
              Ver cursos
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
