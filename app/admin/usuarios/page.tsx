import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
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
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Usuarios</h2>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="liquid-table w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Activo</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const tier = user.tierPurchases[0]?.tier ?? null;
              return (
                <tr key={user.id}>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.full_name ?? "-"}</td>
                  <td className="px-4 py-3"><PlanBadge tier={tier} /></td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.is_active ? "Si" : "No"}</td>
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
