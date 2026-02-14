import { Card } from "@/components/ui/card";
import { currencyFormatter } from "@/lib/payments/helpers";
import { getAdminMetrics } from "@/lib/utils/admin-data";

export default async function AdminHomePage() {
  const metrics = await getAdminMetrics();

  return (
    <div>
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-slate-400">Ingresos mes</p>
          <p className="mt-2 text-2xl font-semibold">
            {currencyFormatter(metrics.monthlyRevenueCents, "CLP")}
          </p>
          <p className="mt-1 text-sm text-emerald-400">
            ≈ {currencyFormatter(Math.round(metrics.monthlyRevenueCents / metrics.clpPerUsd), "USD")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Nuevos users</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.newUsers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Cursos activos</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.activeCourses}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Tokens activos</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.activeTokens}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold">Ultimas ventas</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="liquid-table w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th>Email</th>
                  <th>Curso</th>
                  <th>CLP</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                {metrics.latestSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="py-2">{sale.user?.email ?? "-"}</td>
                    <td>{sale.course?.title ?? "-"}</td>
                    <td>{currencyFormatter(sale.amount_paid_cents ?? 0, "CLP")}</td>
                    <td className="text-emerald-400">≈ {currencyFormatter(Math.round((sale.amount_paid_cents ?? 0) / metrics.clpPerUsd), "USD")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">Tokens activos</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="liquid-table w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th>Token</th>
                  <th>User</th>
                  <th>Leccion</th>
                  <th>Vistas</th>
                </tr>
              </thead>
              <tbody>
                {metrics.latestTokens.map((token) => (
                  <tr key={token.id}>
                    <td className="py-2">{token.token.slice(0, 6)}...</td>
                    <td>{token.user?.email ?? "-"}</td>
                    <td>{token.lesson?.title ?? "-"}</td>
                    <td>
                      {token.current_views}/{token.max_views}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
