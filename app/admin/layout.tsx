import Link from "next/link";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/tokens", label: "Tokens" },
  { href: "/admin/matriculas", label: "Matriculas" },
  { href: "/admin/pagos", label: "Pagos" },
  { href: "/admin/becas", label: "Becas" },
  { href: "/admin/consultas", label: "Consultas Pro" },
  { href: "/admin/configuracion", label: "Configuracion" },
  { href: "/", label: "← Inicio" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin", "superadmin"]);

  return (
    <div className="container-wide py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel admin</h1>
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-400">{user.email}</p>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-lg border border-slate-600/50 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-white/5 hover:text-white">
              Cerrar sesion
            </button>
          </form>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="liquid-surface p-3">
          <nav className="space-y-1 text-sm">
            {adminLinks.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg px-2 py-2 transition hover:bg-white/10">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
