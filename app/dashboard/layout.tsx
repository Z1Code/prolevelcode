import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  return (
    <div className="container-wide py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-lg border border-slate-600/50 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-white/5 hover:text-white">
            ← Inicio
          </Link>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-400">{user?.email}</p>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-lg border border-slate-600/50 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-white/5 hover:text-white">
              Cerrar sesion
            </button>
          </form>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="liquid-surface p-3">
          <p className="px-2 py-3 text-xs text-slate-400">{user?.email}</p>
          <nav className="space-y-1 text-sm">
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/dashboard">Resumen</Link>
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/dashboard/cursos">Mis cursos</Link>
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/dashboard/plan">
              Mi plan
              {currentTier === "pro" ? (
                <span className="ml-1.5 inline-flex items-center rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.15)]">PRO</span>
              ) : currentTier === "basic" ? (
                <span className="ml-1.5 inline-flex items-center rounded-full border border-slate-300/25 bg-gradient-to-r from-slate-300/15 via-slate-200/15 to-slate-300/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-300 shadow-[0_0_6px_rgba(203,213,225,0.1)]">BASIC</span>
              ) : (
                <span className="ml-1.5 inline-flex items-center rounded-full border border-slate-500/20 bg-slate-600/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-500">SIN PLAN</span>
              )}
            </Link>
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/dashboard/consultas">Consultas <span className="ml-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">Pro</span></Link>
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/cursos">Explorar cursos</Link>
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/dashboard/perfil">Perfil</Link>
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
