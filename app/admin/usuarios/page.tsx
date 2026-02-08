import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
    select: { id: true, email: true, full_name: true, role: true, is_active: true, created_at: true },
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Usuarios</h2>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="liquid-table w-full text-left text-sm">
          <thead className="text-slate-400"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Activo</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3">{user.full_name}</td><td className="px-4 py-3">{user.role}</td><td className="px-4 py-3">{user.is_active ? "Si" : "No"}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
