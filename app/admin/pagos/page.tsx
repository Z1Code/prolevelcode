import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currencyFormatter } from "@/lib/payments/helpers";
import { prisma } from "@/lib/prisma";
import { approveCryptoPayment, rejectCryptoPayment, approvePaypalPayment, rejectPaypalPayment, revokeTierPurchase } from "../actions";

export default async function AdminPaymentsPage() {
  const [cryptoPayments, paypalPayments, enrollments, tierPurchases] = await Promise.all([
    prisma.cryptoPayment.findMany({
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
      take: 100,
      include: {
        user: { select: { email: true, full_name: true } },
      },
    }),
    prisma.paypalPayment.findMany({
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
      take: 100,
      include: {
        user: { select: { email: true, full_name: true } },
      },
    }),
    prisma.enrollment.findMany({
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
    }),
    prisma.tierPurchase.findMany({
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
        user: { select: { email: true, full_name: true } },
      },
    }),
  ]);

  const paypalPending = paypalPayments.filter((p) => p.status === "pending");
  const paypalApproved = paypalPayments.filter((p) => p.status === "approved");
  const paypalRejected = paypalPayments.filter((p) => p.status === "rejected");

  const pending = cryptoPayments.filter((p) => p.status === "pending");
  const completed = cryptoPayments.filter((p) => p.status === "completed");
  const expired = cryptoPayments.filter((p) => p.status === "expired");

  /* ── Revenue summary ── */
  const totalEnrollmentCents = enrollments.reduce((sum, e) => sum + (e.amount_paid_cents ?? 0), 0);
  const totalTierCents = tierPurchases.reduce((sum, tp) => sum + tp.amount_paid_cents, 0);
  const cryptoCompletedUsdt = completed.reduce((sum, p) => sum + parseFloat(p.amount_usdt), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Pagos</h2>

      {/* ── Summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs text-slate-400">PayPal pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{paypalPending.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-400">Crypto pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{pending.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-400">Crypto completados</p>
          <p className="mt-1 text-2xl font-semibold">{completed.length}</p>
          <p className="mt-0.5 text-xs text-slate-500">{cryptoCompletedUsdt.toFixed(2)} USDT total</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-400">Compras de planes</p>
          <p className="mt-1 text-2xl font-semibold">{tierPurchases.length}</p>
          {totalTierCents > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">{currencyFormatter(totalTierCents, "CLP")} total</p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-400">Matriculas</p>
          <p className="mt-1 text-2xl font-semibold">{enrollments.length}</p>
          {totalEnrollmentCents > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">{currencyFormatter(totalEnrollmentCents, "CLP")} total</p>
          )}
        </Card>
      </div>

      {/* ── Pending PayPal (action required) ── */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Pagos PayPal pendientes</h3>
          {paypalPending.length > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
              {paypalPending.length}
            </span>
          )}
        </div>

        {paypalPending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No hay pagos PayPal pendientes.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {paypalPending.map((p) => (
              <div key={p.id} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-300">
                        ${(p.amount_usd_cents / 100).toFixed(0)} USD
                      </span>
                      <TierBadge tier={p.tier} />
                      <ProviderBadge provider="paypal" />
                    </div>
                    <p className="text-xs text-slate-300">{p.user.email}</p>
                    {p.user.full_name && (
                      <p className="text-[10px] text-slate-500">{p.user.full_name}</p>
                    )}
                    <p className="text-[10px] text-slate-500">
                      Creado:{" "}
                      {p.created_at.toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Santiago",
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <form action={approvePaypalPayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" size="sm">
                        Aprobar
                      </Button>
                    </form>
                    <form action={rejectPaypalPayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" variant="danger" size="sm">
                        Rechazar
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Screenshot preview */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-slate-400 hover:text-white transition">
                    Ver comprobante
                  </summary>
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.screenshot_b64}
                      alt="Comprobante PayPal"
                      className="max-w-sm rounded-lg border border-slate-700"
                    />
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Approved PayPal ── */}
      {paypalApproved.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-semibold">Pagos PayPal aprobados ({paypalApproved.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="liquid-table w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Aprobado</th>
                </tr>
              </thead>
              <tbody>
                {paypalApproved.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      {p.user.email}
                      {p.user.full_name && <p className="text-[10px] text-slate-500">{p.user.full_name}</p>}
                    </td>
                    <td className="px-4 py-3"><TierBadge tier={p.tier} /></td>
                    <td className="px-4 py-3 font-mono text-emerald-300">${(p.amount_usd_cents / 100).toFixed(0)} USD</td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.approved_at?.toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Santiago",
                      }) ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Rejected PayPal ── */}
      {paypalRejected.length > 0 && (
        <Card className="overflow-hidden p-0">
          <details>
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-400 transition hover:text-white">
              Pagos PayPal rechazados ({paypalRejected.length})
            </summary>
            <div className="overflow-x-auto">
              <table className="liquid-table w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {paypalRejected.map((p) => (
                    <tr key={p.id} className="text-slate-500">
                      <td className="px-4 py-3">{p.user.email}</td>
                      <td className="px-4 py-3"><TierBadge tier={p.tier} /></td>
                      <td className="px-4 py-3 font-mono">${(p.amount_usd_cents / 100).toFixed(0)} USD</td>
                      <td className="px-4 py-3">
                        {p.created_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Card>
      )}

      {/* ── Pending crypto (action required) ── */}
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
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-300">
                        {p.amount_usdt} USDT
                      </span>
                      <TypeBadge type={p.type} targetId={p.target_id} />
                    </div>
                    <p className="text-xs text-slate-300">{p.user.email}</p>
                    {p.user.full_name && (
                      <p className="text-[10px] text-slate-500">{p.user.full_name}</p>
                    )}
                    <p className="text-[10px] text-slate-500">
                      Orden: <span className="font-mono">{p.order_id}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Creado:{" "}
                      {p.created_at.toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Santiago",
                      })}
                      {" · Expira: "}
                      {p.expires_at.toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Santiago",
                      })}
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

      {/* ── Completed crypto ── */}
      <Card className="overflow-hidden p-0">
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-semibold">Pagos crypto completados ({completed.length})</h3>
        </div>
        {completed.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-500">Sin pagos completados aun.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="liquid-table w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">TxHash</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      {p.user.email}
                      {p.user.full_name && <p className="text-[10px] text-slate-500">{p.user.full_name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={p.type} targetId={p.target_id} />
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-300">
                      {p.amount_usdt} USDT
                    </td>
                    <td className="px-4 py-3">
                      <TxHashLink hash={p.tx_hash} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.completed_at?.toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Santiago",
                      }) ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Expired / rejected crypto ── */}
      {expired.length > 0 && (
        <Card className="overflow-hidden p-0">
          <details>
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-400 transition hover:text-white">
              Pagos crypto expirados / rechazados ({expired.length})
            </summary>
            <div className="overflow-x-auto">
              <table className="liquid-table w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3">Orden</th>
                    <th className="px-4 py-3">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {expired.map((p) => (
                    <tr key={p.id} className="text-slate-500">
                      <td className="px-4 py-3">{p.user.email}</td>
                      <td className="px-4 py-3">
                        <TypeBadge type={p.type} targetId={p.target_id} />
                      </td>
                      <td className="px-4 py-3 font-mono">{p.amount_usdt} USDT</td>
                      <td className="px-4 py-3 font-mono text-[10px]">{p.order_id}</td>
                      <td className="px-4 py-3">
                        {p.created_at.toLocaleString("es-CL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Card>
      )}

      {/* ── Tier purchases ── */}
      <Card className="overflow-hidden p-0">
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-semibold">Compras de planes ({tierPurchases.length})</h3>
        </div>
        {tierPurchases.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-500">Sin compras de planes aun.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="liquid-table w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Metodo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tierPurchases.map((tp) => (
                  <tr key={tp.id}>
                    <td className="px-4 py-3">
                      {tp.user.email}
                      {tp.user.full_name && <p className="text-[10px] text-slate-500">{tp.user.full_name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={tp.tier} />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {currencyFormatter(tp.amount_paid_cents, tp.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <ProviderBadge provider={tp.payment_provider} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tp.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {tp.purchased_at.toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Santiago",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {tp.status === "active" && (
                        <form action={revokeTierPurchase}>
                          <input type="hidden" name="id" value={tp.id} />
                          <Button type="submit" variant="danger" size="sm">
                            Revocar
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Course enrollments ── */}
      <Card className="overflow-hidden p-0">
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-semibold">Matriculas de cursos ({enrollments.length})</h3>
        </div>
        {enrollments.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-500">Sin matriculas aun.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="liquid-table w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Metodo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3">{e.user.email}</td>
                    <td className="px-4 py-3">{e.course.title}</td>
                    <td className="px-4 py-3 font-mono">
                      {currencyFormatter(e.amount_paid_cents ?? 0, e.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <ProviderBadge provider={e.payment_provider ?? "mercadopago"} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {e.enrolled_at.toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Santiago",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─── Helper components ─── */

function TypeBadge({ type, targetId }: { type: string; targetId: string }) {
  if (type === "tier") {
    return <TierBadge tier={targetId} />;
  }
  return (
    <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
      Curso
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const isPro = tier === "pro";
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
        isPro ? "bg-violet-500/15 text-violet-300" : "bg-emerald-500/15 text-emerald-300"
      }`}
    >
      {tier.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "active"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "pending"
        ? "bg-amber-500/15 text-amber-300"
        : "bg-red-500/15 text-red-300";
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${colors}`}>
      {status}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const labels: Record<string, { label: string; colors: string }> = {
    mercadopago: { label: "MercadoPago", colors: "bg-sky-500/15 text-sky-300" },
    crypto: { label: "Crypto", colors: "bg-amber-500/15 text-amber-300" },
    binance: { label: "Binance", colors: "bg-yellow-500/15 text-yellow-300" },
    paypal: { label: "PayPal", colors: "bg-blue-500/15 text-blue-300" },
    admin_grant: { label: "Admin", colors: "bg-violet-500/15 text-violet-300" },
  };
  const match = labels[provider] ?? { label: provider, colors: "bg-slate-500/15 text-slate-400" };
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${match.colors}`}>
      {match.label}
    </span>
  );
}

function TxHashLink({ hash }: { hash: string | null }) {
  if (!hash) return <span className="text-slate-500">-</span>;

  if (hash === "manual_admin_approval") {
    return (
      <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
        Manual
      </span>
    );
  }

  // BSC hashes start with 0x, Solana signatures are base58 without prefix
  const isBsc = hash.startsWith("0x");
  const explorerUrl = isBsc
    ? `https://bscscan.com/tx/${hash}`
    : `https://solscan.io/tx/${hash}`;
  const label = isBsc ? "BSC" : "SOL";

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5"
    >
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${isBsc ? "bg-yellow-500/15 text-yellow-300" : "bg-violet-500/15 text-violet-300"}`}>
        {label}
      </span>
      <span className="font-mono text-[10px] text-slate-400 underline decoration-slate-600 underline-offset-2 transition group-hover:text-white group-hover:decoration-white">
        {hash.slice(0, 16)}...
      </span>
    </a>
  );
}
