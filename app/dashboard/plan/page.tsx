import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { TIERS, EARLY_PRO_LIMIT } from "@/lib/tiers/config";
import { EarlyProBonus } from "@/components/rewards/early-pro-bonus";

interface PlanPageProps {
  searchParams: Promise<{ checkout?: string; already?: string }>;
}

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const { checkout, already } = await searchParams;
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  const purchases = user
    ? await prisma.tierPurchase.findMany({
        where: { user_id: user.id, status: "active" },
        orderBy: { purchased_at: "desc" },
      })
    : [];

  const scholarship = user
    ? await prisma.scholarship.findFirst({
        where: { recipient_user_id: user.id, status: "active" },
        select: { expires_at: true, grantor: { select: { email: true } } },
      })
    : null;

  /* ── Early Pro bonus: check if this user is among the first N Pro purchasers ── */
  let earlyProOrder: number | null = null;

  if (user && currentTier === "pro") {
    const firstProPurchases = await prisma.tierPurchase.findMany({
      where: { tier: "pro", status: "active" },
      orderBy: { purchased_at: "asc" },
      take: EARLY_PRO_LIMIT,
      select: { user_id: true },
    });

    const idx = firstProPurchases.findIndex((p) => p.user_id === user.id);
    if (idx !== -1) {
      earlyProOrder = idx + 1; // 1-based
    }
  }

  const showBonus = checkout === "success" && earlyProOrder !== null;

  return (
    <div>
      {checkout === "success" && (
        <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Plan activado exitosamente.
        </div>
      )}
      {already === "true" && (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Ya tienes este plan o uno superior activo.
        </div>
      )}

      {/* Early Pro bonus — animated gift for first 6 Pro users */}
      {showBonus && (
        <div className="mb-6">
          <EarlyProBonus proOrderNumber={earlyProOrder!} />
        </div>
      )}

      {/* Persistent badge for early Pro users (non-checkout visits) */}
      {!showBonus && earlyProOrder !== null && (
        <Card className="mb-4 border-violet-400/20 bg-violet-500/5 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-sm font-semibold text-violet-200">
                Bonus: usuario Pro #{earlyProOrder}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Tu beca para un amigo es permanente (de por vida).{" "}
                <Link href="/dashboard/beca" className="text-violet-300 underline hover:text-violet-200">
                  Gestionar beca
                </Link>
              </p>
            </div>
          </div>
        </Card>
      )}

      <h2 className="text-2xl font-semibold">Mi plan</h2>

      <Card className="mt-4 p-5">
        <div className="flex items-center gap-3">
          <p className="text-lg font-semibold">
            {currentTier === "pro" ? "Pro" : currentTier === "basic" ? "Basic" : "Sin plan"}
          </p>
          {currentTier && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              currentTier === "pro"
                ? "bg-violet-500/15 text-violet-300"
                : "bg-emerald-500/15 text-emerald-300"
            }`}>
              Activo
            </span>
          )}
        </div>

        {currentTier && (
          <p className="mt-2 text-sm text-slate-400">
            Acceso de por vida a {currentTier === "pro" ? "todos los cursos" : "los cursos Basic"}.
          </p>
        )}

        {!currentTier && (
          <div className="mt-3">
            <p className="text-sm text-slate-400">No tienes un plan activo.</p>
            <Link href="/planes" className="mt-2 inline-block">
              <Button size="sm">Ver planes</Button>
            </Link>
          </div>
        )}

        {scholarship && (
          <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/5 p-3">
            <p className="text-sm font-medium text-amber-200">Beca activa</p>
            <p className="mt-1 text-xs text-slate-400">
              Otorgada por {scholarship.grantor.email}
              {scholarship.expires_at ? (
                <> &middot; Expira: {new Date(scholarship.expires_at).toLocaleDateString("es-ES")}</>
              ) : (
                <> &middot; Permanente</>
              )}
            </p>
          </div>
        )}
      </Card>

      {purchases.length > 0 && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Historial de compras</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-slate-300">
                <span>Plan {p.tier === "pro" ? "Pro" : "Basic"}</span>
                <span className="text-xs text-slate-500">
                  {new Date(p.purchased_at).toLocaleDateString("es-ES")} &middot; {p.payment_provider} &middot; ${(p.amount_paid_cents / 100).toFixed(2)} {p.currency}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {currentTier === "pro" && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Beca para un amigo</h3>
          <p className="mt-1 text-sm text-slate-400">
            {earlyProOrder
              ? "Tu beca es permanente (de por vida) por ser de los primeros 6 Pro."
              : "Puedes otorgar una beca de 30 dias de acceso Basic a un amigo."}
          </p>
          <Link href="/dashboard/beca" className="mt-3 inline-block">
            <Button size="sm">Gestionar beca</Button>
          </Link>
        </Card>
      )}

      {currentTier === "basic" && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Upgrade a Pro</h3>
          <p className="mt-1 text-sm text-slate-400">
            Accede a DevOps, Crypto Trading, Crypto DeFi y todos los cursos futuros.
          </p>
          <Link href="/planes" className="mt-3 inline-block">
            <Button size="sm">Ver plan Pro - {TIERS.pro.priceDisplay}</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
