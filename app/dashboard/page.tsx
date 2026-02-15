import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { DashboardShell, StaggerGrid, StaggerCard } from "@/components/dashboard/dashboard-shell";

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
    <DashboardShell>
      <div className="mb-1">
        <h2 className="text-xl font-semibold tracking-tight">Resumen</h2>
        <p className="mt-1 text-sm text-slate-500">Bienvenido de vuelta{user?.email ? `, ${user.email.split("@")[0]}` : ""}.</p>
      </div>

      {/* Stats grid */}
      <StaggerGrid className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StaggerCard key={stat.label}>
            <Card className="hover-lift group relative overflow-hidden p-5">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.glow} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">{stat.label}</p>
                  <span className={`${stat.accent} opacity-30 transition-opacity duration-300 group-hover:opacity-60`}>{stat.icon}</span>
                </div>
                <p className={`mt-3 text-3xl font-bold tracking-tight ${stat.accent}`} style={{ animation: "countUp 0.6s ease-out both" }}>{stat.value}</p>
              </div>
            </Card>
          </StaggerCard>
        ))}
      </StaggerGrid>

      {/* Action card */}
      <StaggerGrid className="mt-6 space-y-6">
        <StaggerCard>
          <Card className="hover-lift p-6">
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
        </StaggerCard>

        {/* Discord community card */}
        {currentTier && (
          <StaggerCard>
            <Card className="hover-lift p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5865F2]/10">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#5865F2]">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">Comunidad Discord</p>
                  <p className="mt-0.5 text-xs text-slate-500">Conecta con otros estudiantes, comparte proyectos y resuelve dudas.</p>
                </div>
                <a
                  href="https://discord.gg/RHGdMW6B"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-xl border border-[#5865F2]/20 bg-[#5865F2]/10 px-4 py-2 text-sm font-medium text-[#7289da] transition-all duration-200 hover:border-[#5865F2]/30 hover:bg-[#5865F2]/15 hover:shadow-[0_0_20px_rgba(88,101,242,0.08)]"
                >
                  Unirse
                </a>
              </div>
            </Card>
          </StaggerCard>
        )}
      </StaggerGrid>
    </DashboardShell>
  );
}
