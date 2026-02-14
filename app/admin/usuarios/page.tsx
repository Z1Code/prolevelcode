import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { DeleteUserButton } from "./delete-user-button";

export default async function AdminUsersPage() {
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
        tierPurchases: {
          where: { status: "active" },
          orderBy: { purchased_at: "desc" },
          take: 1,
          select: { tier: true },
        },
      },
    }),
    prisma.user.count(),
  ]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Usuarios</h2>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-medium text-slate-300">
          {totalCount}
        </span>
      </div>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="liquid-table w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const tier = user.tierPurchases[0]?.tier ?? null;
              const isAdmin = user.role === "admin" || user.role === "superadmin";
              return (
                <tr key={user.id}>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.full_name ?? "-"}</td>
                  <td className="px-4 py-3"><PlanBadge tier={tier} /></td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.is_active ? "Si" : "No"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {user.created_at.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Santiago" })}
                  </td>
                  <td className="px-4 py-3">
                    {!isAdmin && (
                      <DeleteUserButton userId={user.id} userEmail={user.email} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function PlanBadge({ tier }: { tier: string | null }) {
  if (tier === "pro") {
    return (
      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
        PRO
      </span>
    );
  }
  if (tier === "basic") {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
        BASIC
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
      Gratis
    </span>
  );
}
