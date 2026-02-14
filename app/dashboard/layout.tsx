import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";

export const dynamic = "force-dynamic";

const tierBadge = {
  pro: "inline-flex items-center rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.15)]",
  basic: "inline-flex items-center rounded-full border border-slate-300/25 bg-gradient-to-r from-slate-300/15 via-slate-200/15 to-slate-300/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300 shadow-[0_0_6px_rgba(203,213,225,0.1)]",
  none: "inline-flex items-center rounded-full border border-slate-500/20 bg-slate-600/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-500",
  feature: "inline-flex items-center rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-500/20 via-purple-400/20 to-violet-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-violet-300 shadow-[0_0_6px_rgba(167,139,250,0.15)]",
};

const navLink = "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-white/[0.06]";
const navIcon = "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-500";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  return (
    <div className="container-wide py-8">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-xs text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Inicio
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:block">{user?.email}</span>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-xs text-slate-400 transition-all duration-200 hover:border-red-400/20 hover:bg-red-500/5 hover:text-red-300">
              Cerrar sesion
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="liquid-surface p-4">
          <div className="mb-4 border-b border-white/[0.06] pb-4">
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            {currentTier && (
              <div className="mt-2">
                <span className={currentTier === "pro" ? tierBadge.pro : tierBadge.basic}>
                  {currentTier === "pro" ? "PRO" : "BASIC"}
                </span>
              </div>
            )}
          </div>
          <nav className="space-y-1">
            <Link className={navLink} href="/dashboard">
              <div className="flex items-center gap-3">
                <span className={navIcon}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                </span>
                Resumen
              </div>
            </Link>
            <Link className={navLink} href="/dashboard/cursos">
              <div className="flex items-center gap-3">
                <span className={navIcon}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                </span>
                Mis cursos
              </div>
            </Link>
            <Link className={navLink} href="/dashboard/plan">
              <div className="flex items-center gap-3">
                <span className={navIcon}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" /></svg>
                </span>
                Mi plan
              </div>
              <span className={currentTier === "pro" ? tierBadge.pro : currentTier === "basic" ? tierBadge.basic : tierBadge.none}>
                {currentTier === "pro" ? "PRO" : currentTier === "basic" ? "BASIC" : "SIN PLAN"}
              </span>
            </Link>
            <Link className={navLink} href="/dashboard/consultas">
              <div className="flex items-center gap-3">
                <span className={navIcon}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" /></svg>
                </span>
                Consultas
              </div>
              <span className={tierBadge.feature}>PRO</span>
            </Link>

            <div className="!mt-3 border-t border-white/[0.06] pt-3">
              <Link className={navLink} href="/cursos">
                <div className="flex items-center gap-3">
                  <span className={navIcon}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                  </span>
                  Explorar cursos
                </div>
              </Link>
              <Link className={navLink} href="/dashboard/perfil">
                <div className="flex items-center gap-3">
                  <span className={navIcon}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </span>
                  Perfil
                </div>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
