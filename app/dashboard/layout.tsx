import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

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
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/cursos">Explorar cursos</Link>
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/dashboard/perfil">Perfil</Link>
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
