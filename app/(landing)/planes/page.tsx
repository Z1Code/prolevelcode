import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { TIERS, EARLY_PRO_LIMIT } from "@/lib/tiers/config";
import { TierCard } from "@/components/pricing/tier-card";
import { prisma } from "@/lib/prisma";

interface PlanesPageProps {
  searchParams: Promise<{ checkout?: string }>;
}

export default async function PlanesPage({ searchParams }: PlanesPageProps) {
  const { checkout } = await searchParams;
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  // Count how many Pro purchases exist to show "spots remaining" banner
  const proCount = await prisma.tierPurchase.count({
    where: { tier: "pro", status: "active" },
  });
  const spotsRemaining = Math.max(0, EARLY_PRO_LIMIT - proCount);

  return (
    <main className="container-wide section-spacing liquid-section">
      {checkout === "failure" && (
        <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          El pago no se completo. Puedes intentar de nuevo.
        </div>
      )}
      {checkout === "error" && (
        <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          No se pudo iniciar el pago. Intenta de nuevo mas tarde.
        </div>
      )}

      <div className="text-center">
        <h1 className="text-4xl font-bold md:text-6xl">Planes</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          Acceso de por vida. Un solo pago. Sin suscripciones ni renovaciones.
        </p>
      </div>

      {/* Early Pro bonus banner */}
      {spotsRemaining > 0 && (
        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-violet-400/25 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-violet-500/10 px-5 py-3 text-center">
          <p className="text-sm text-violet-200">
            🎁 Los primeros <span className="font-bold">6 usuarios Pro</span> reciben una beca
            <span className="font-semibold text-emerald-300"> permanente </span>
            para regalar a un amigo
            <span className="ml-1 text-xs text-slate-400">
              ({spotsRemaining} {spotsRemaining === 1 ? "lugar disponible" : "lugares disponibles"})
            </span>
          </p>
        </div>
      )}

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        <TierCard
          name={TIERS.basic.name}
          price={TIERS.basic.priceDisplay}
          description={TIERS.basic.description}
          features={[...TIERS.basic.features]}
          tier="basic"
          isCurrentPlan={currentTier === "basic"}
          isLoggedIn={!!user}
          onCheckoutMp="/api/checkout/tier"
          onCheckoutCrypto="/api/checkout/crypto/tier"
        />
        <TierCard
          name={TIERS.pro.name}
          price={TIERS.pro.priceDisplay}
          description={TIERS.pro.description}
          features={[...TIERS.pro.features]}
          tier="pro"
          highlighted
          isCurrentPlan={currentTier === "pro"}
          isLoggedIn={!!user}
          onCheckoutMp="/api/checkout/tier"
          onCheckoutCrypto="/api/checkout/crypto/tier"
        />
      </div>

      <div className="mt-8 text-center">
        <Link href="/cursos" className="text-sm text-slate-400 hover:text-white transition">
          O compra cursos individuales →
        </Link>
      </div>
    </main>
  );
}
