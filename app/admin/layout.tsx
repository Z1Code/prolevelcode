import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/tokens", label: "Tokens" },
  { href: "/admin/pagos", label: "Pagos" },
  { href: "/admin/contacto", label: "Contacto" },
  { href: "/admin/configuracion", label: "Configuracion" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="container-wide liquid-section py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel admin</h1>
        <p className="text-xs text-slate-400">{user?.email}</p>
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


