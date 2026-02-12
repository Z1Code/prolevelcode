import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currencyFormatter } from "@/lib/payments/helpers";
import { prisma } from "@/lib/prisma";
import { approveCryptoPayment, rejectCryptoPayment } from "../actions";

export default async function AdminPaymentsPage() {
  /* ── Crypto payments (pending first) ── */
  const cryptoPayments = await prisma.cryptoPayment.findMany({
    orderBy: [{ status: "asc" }, { created_at: "desc" }],
    take: 100,
    include: {
      user: { select: { email: true, full_name: true } },
    },
  });

  const pending = cryptoPayments.filter((p) => p.status === "pending");
  const completed = cryptoPayments.filter((p) => p.status === "completed");
  const expired = cryptoPayments.filter((p) => p.status === "expired");

  /* ── Traditional enrollment payments ── */
  const enrollments = await prisma.enrollment.findMany({
    orderBy: { enrolled_at: "desc" },
    take: 50,
    select: {
      id: true,
      amount_paid_cents: true,
      currency: true,
      status: true,
      payment_provider: true,
      enrolled_at: true,
      user: { select: { email: true } },
      course: { select: { title: true } },
    },
  });

  /* ── Tier purchases ── */
  const tierPurchases = await prisma.tierPurchase.findMany({
    orderBy: { purchased_at: "desc" },
    take: 50,
    select: {
      id: true,
      tier: true,
      status: true,
      payment_provider: true,
      amount_paid_cents: true,
      currency: true,
      purchased_at: true,
      user: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Pagos</h2>

      {/* ═══════════════════════════════════════════
          CRYPTO: Pending (needs manual approval)
          ═══════════════════════════════════════════ */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Pagos crypto pendientes</h3>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No hay pagos pendientes de verificacion.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-300">{p.amount_usdt} USDT</span>
                      <TypeBadge type={p.type} targetId={p.target_id} />
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{p.user.email}</p>
                    {p.user.full_name && (
                      <p className="text-[10px] text-slate-500">{p.user.full_name}</p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-500">
                      Orden: <span className="font-mono">{p.order_id}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Creado: {p.created_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                      {" · "}
                      Expira: {p.expires_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <form action={approveCryptoPayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" size="sm">
                        Aprobar
                      </Button>
                    </form>
                    <form action={rejectCryptoPayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" variant="danger" size="sm">
                        Rechazar
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════
          CRYPTO: Completed
          ═══════════════════════════════════════════ */}
      <Card className="p-4">
        <h3 className="font-semibold">Pagos crypto completados ({completed.length})</h3>
        {completed.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin pagos completados aun.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="liquid-table w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Monto</th>
                  <th className="px-3 py-2">TxHash</th>
                  <th className="px-3 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2">{p.user.email}</td>
                    <td className="px-3 py-2"><TypeBadge type={p.type} targetId={p.target_id} /></td>
                    <td className="px-3 py-2 font-mono">{p.amount_usdt} USDT</td>
                    <td className="px-3 py-2">
                      {p.tx_hash === "manual_admin_approval" ? (
                        <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] text-violet-300">Manual</span>
                      ) : (
                        <span className="font-mono text-[10px] text-slate-500">{p.tx_hash?.slice(0, 16)}...</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{p.completed_at?.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════
          CRYPTO: Expired / Rejected
          ═══════════════════════════════════════════ */}
      {expired.length > 0 && (
        <Card className="p-4">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-slate-400 hover:text-white transition">
              Pagos crypto expirados/rechazados ({expired.length})
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="liquid-table w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Monto</th>
                    <th className="px-3 py-2">Orden</th>
                    <th className="px-3 py-2">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {expired.map((p) => (
                    <tr key={p.id} className="text-slate-500">
                      <td className="px-3 py-2">{p.user.email}</td>
                      <td className="px-3 py-2"><TypeBadge type={p.type} targetId={p.target_id} /></td>
                      <td className="px-3 py-2 font-mono">{p.amount_usdt}</td>
                      <td className="px-3 py-2 font-mono text-[10px]">{p.order_id}</td>
                      <td className="px-3 py-2">{p.created_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Card>
      )}

      {/* ═══════════════════════════════════════════
          TIER PURCHASES
          ═══════════════════════════════════════════ */}
      <Card className="p-4">
        <h3 className="font-semibold">Compras de planes ({tierPurchases.length})</h3>
        {tierPurchases.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin compras de planes aun.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="liquid-table w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Monto</th>
                  <th className="px-3 py-2">Metodo</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {tierPurchases.map((tp) => (
                  <tr key={tp.id}>
                    <td className="px-3 py-2">{tp.user.email}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tp.tier === "pro" ? "bg-violet-500/15 text-violet-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                        {tp.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{currencyFormatter(tp.amount_paid_cents, tp.currency)}</td>
                    <td className="px-3 py-2 text-slate-400">{tp.payment_provider}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tp.status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                        {tp.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{tp.purchased_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════
          COURSE ENROLLMENTS
          ═══════════════════════════════════════════ */}
      <Card className="p-4">
        <h3 className="font-semibold">Matriculas de cursos ({enrollments.length})</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="liquid-table w-full text-left text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Curso</th>
                <th className="px-3 py-2">Monto</th>
                <th className="px-3 py-2">Metodo</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2">{e.user.email}</td>
                  <td className="px-3 py-2">{e.course.title}</td>
                  <td className="px-3 py-2 font-mono">{currencyFormatter(e.amount_paid_cents ?? 0, e.currency)}</td>
                  <td className="px-3 py-2 text-slate-400">{e.payment_provider ?? "mercadopago"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${e.status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{e.enrolled_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─── Helper component ─── */

function TypeBadge({ type, targetId }: { type: string; targetId: string }) {
  if (type === "tier") {
    return (
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${targetId === "pro" ? "bg-violet-500/15 text-violet-300" : "bg-emerald-500/15 text-emerald-300"}`}>
        Plan {targetId.toUpperCase()}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
      Curso
    </span>
  );
}
