import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="container-wide liquid-section py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard estudiante</h1>
        <form action="/api/auth/logout" method="post">
          <button className="liquid-surface-soft px-3 py-2 text-sm">Cerrar sesion</button>
        </form>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="liquid-surface p-3">
          <p className="px-2 py-3 text-xs text-slate-400">{user?.email}</p>
          <nav className="space-y-1 text-sm">
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/dashboard">Resumen</Link>
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/dashboard/cursos">Mis cursos</Link>
            <Link className="block rounded-lg px-2 py-2 transition hover:bg-white/10" href="/dashboard/perfil">Perfil</Link>
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}


