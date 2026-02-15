import { Card } from "@/components/ui/card";
import { currencyFormatter } from "@/lib/payments/helpers";
import { getAdminMetrics } from "@/lib/utils/admin-data";

export default async function AdminHomePage() {
  const metrics = await getAdminMetrics();

  return (
    <div className="page-enter">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="mt-4 stagger-enter grid gap-4 md:grid-cols-5">
        <Card className="p-4 hover-lift">
          <p className="text-sm text-slate-400">Ingresos totales</p>
          {(() => {
            const totalUsd = metrics.totalUsdCents + Math.round(metrics.totalClpCents / metrics.clpPerUsd);
            if (totalUsd === 0) return <p className="mt-2 text-2xl font-semibold text-slate-500">$0</p>;
            return (
              <>
                <p className="mt-2 text-2xl font-semibold text-emerald-400">
                  {currencyFormatter(totalUsd, "USD")}
                </p>
                <p className="mt-0.5 text-sm text-slate-400">
                  ≈ {currencyFormatter(Math.round(totalUsd * metrics.clpPerUsd), "CLP")}
                </p>
              </>
            );
          })()}
        </Card>
        <Card className="p-4 hover-lift">
          <p className="text-sm text-slate-400">Ingresos mes</p>
          {(() => {
            const monthUsd = metrics.monthlyUsdCents + Math.round(metrics.monthlyClpCents / metrics.clpPerUsd);
            if (monthUsd === 0) return <p className="mt-2 text-2xl font-semibold text-slate-500">$0</p>;
            return (
              <>
                <p className="mt-2 text-2xl font-semibold">
                  {currencyFormatter(monthUsd, "USD")}
                </p>
                <p className="mt-0.5 text-sm text-slate-400">
                  ≈ {currencyFormatter(Math.round(monthUsd * metrics.clpPerUsd), "CLP")}
                </p>
              </>
            );
          })()}
        </Card>
        <Card className="p-4 hover-lift">
          <p className="text-sm text-slate-400">Nuevos users</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.newUsers}</p>
        </Card>
        <Card className="p-4 hover-lift">
          <p className="text-sm text-slate-400">Cursos activos</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.activeCourses}</p>
        </Card>
        <Card className="p-4 hover-lift">
          <p className="text-sm text-slate-400">Tokens activos</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.activeTokens}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4 hover-lift">
          <h3 className="font-semibold">Ultimas ventas</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="liquid-table w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Monto</th>
                  <th>Equiv.</th>
                </tr>
              </thead>
              <tbody>
                {metrics.latestSales.map((sale) => {
                  const cents = sale.amount_paid_cents ?? 0;
                  const isUsd = sale.currency === "USD" || sale.currency === "USDT";
                  const usdCents = isUsd ? cents : Math.round(cents / metrics.clpPerUsd);
                  return (
                    <tr key={sale.id}>
                      <td className="py-2">{sale.user?.email ?? "-"}</td>
                      <td>
                        <span className={sale.tier === "pro" ? "text-amber-300" : "text-slate-300"}>
                          {sale.tier === "pro" ? "Pro" : "Basic"}
                        </span>
                      </td>
                      <td>{currencyFormatter(usdCents, "USD")}</td>
                      <td className="text-emerald-400">
                        ≈ {currencyFormatter(Math.round(usdCents * metrics.clpPerUsd), "CLP")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4 hover-lift">
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
