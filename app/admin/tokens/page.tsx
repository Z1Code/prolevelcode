import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminTokensPage() {
  const tokens = await prisma.videoToken.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
    select: {
      id: true,
      expires_at: true,
      user: { select: { email: true } },
      lesson: { select: { title: true } },
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Monitor de tokens</h2>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="liquid-table w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Leccion</th>
              <th className="px-4 py-3">Expira</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                <td className="px-4 py-3">{token.user.email}</td>
                <td className="px-4 py-3">{token.lesson.title}</td>
                <td className="px-4 py-3">{token.expires_at.toLocaleString("es-ES")}</td>
                <td className="px-4 py-3">
                  {token.expires_at > new Date() ? "Activo" : "Expirado"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
