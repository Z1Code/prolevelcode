import type { ReactNode } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { DashboardShell, StaggerGrid, StaggerCard } from "@/components/dashboard/dashboard-shell";
import { TierCard } from "@/components/pricing/tier-card";
import { TIERS, EARLY_PRO_LIMIT } from "@/lib/tiers/config";
import { prisma } from "@/lib/prisma";

/* ── Curriculum modules (static data) ── */

interface CurriculumModule {
  title: string;
  description: string;
  slug: string;
  icon: ReactNode;
}

const BASIC_MODULES: CurriculumModule[] = [
  {
    title: "Introducción",
    description: "Fundamentos, setup del entorno y primeros pasos en el desarrollo web",
    slug: "introduccion",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-3.173 1.36 3.173 1.36a1 1 0 00.788 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.547l1.606.688a3 3 0 002.788 0l1.606-.688v3.547a9.026 9.026 0 00-2.3 1.638z" />
      </svg>
    ),
  },
  {
    title: "BDD + Auth + Seguridad",
    description: "Base de datos, autenticación de usuarios y buenas prácticas de seguridad",
    slug: "bdd-auth-seguridad",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "Prácticas",
    description: "Construye varias aplicaciones reales paso a paso desde cero",
    slug: "practicas",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "Pasos finales",
    description: "Deploy, optimización, SEO y lanzamiento a producción",
    slug: "pasos-finales",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const PRO_MODULES: CurriculumModule[] = [
  {
    title: "Introducción",
    description: "Arquitectura avanzada, patrones de diseño y setup profesional",
    slug: "pro-introduccion",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  {
    title: "Avanzado",
    description: "Técnicas avanzadas, rendimiento y escalabilidad en producción",
    slug: "pro-avanzado",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "Características profesionales",
    description: "Pagos, dashboards, analytics y features de apps SaaS reales",
    slug: "pro-caracteristicas",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
      </svg>
    ),
  },
  {
    title: "Prácticas",
    description: "Proyectos profesionales completos con CI/CD y testing",
    slug: "pro-practicas",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "Pasos finales",
    description: "Monetización, marketing técnico y estrategia de lanzamiento",
    slug: "pro-pasos-finales",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
];

/* ── Card components ── */

function BasicModuleCard({ mod }: { mod: CurriculumModule }) {
  return (
    <Link href={`/dashboard/cursos/${mod.slug}`} className="block">
      <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-200 hover:border-emerald-400/20 hover:bg-white/[0.05] hover:shadow-[0_0_24px_rgba(52,211,153,0.06)]">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/15">
              {mod.icon}
            </div>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-400">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-200 transition-colors group-hover:text-white">
            {mod.title}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {mod.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ProModuleCard({ mod, locked }: { mod: CurriculumModule; locked: boolean }) {
  if (locked) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-amber-400/[0.06] bg-white/[0.015] p-5 opacity-40 select-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-transparent" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/[0.07] text-amber-400/50">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-400/60">
              PRO
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-400">
            {mod.title}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/dashboard/cursos/${mod.slug}`} className="block">
      <div className="group relative overflow-hidden rounded-xl border border-amber-400/[0.12] bg-gradient-to-br from-amber-500/[0.04] via-white/[0.02] to-transparent p-5 transition-all duration-200 hover:border-amber-400/25 hover:shadow-[0_0_24px_rgba(251,191,36,0.08)]">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 transition-colors group-hover:bg-amber-500/15">
              {mod.icon}
            </div>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-600/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-amber-400">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-amber-200 transition-colors group-hover:text-amber-100">
            {mod.title}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-400/40">
            {mod.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ── */

export default async function DashboardCoursesPage() {
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;
  const isPro = currentTier === "pro";
  const hasAccess = currentTier === "basic" || currentTier === "pro";

  // For users without a plan, show pricing cards
  let spotsRemaining = 0;
  if (!hasAccess) {
    try {
      const proCount = await prisma.tierPurchase.count({
        where: { tier: "pro", status: "active" },
      });
      spotsRemaining = Math.max(0, EARLY_PRO_LIMIT - proCount);
    } catch {
      spotsRemaining = 0;
    }
  }

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold tracking-tight">Mis cursos</h2>
        {currentTier && (
          <p className="mt-1 text-sm text-slate-500">
            Plan activo:{" "}
            <span className={isPro ? "font-medium text-amber-300" : "font-medium text-slate-300"}>
              {isPro ? "Pro" : "Basic"}
            </span>
          </p>
        )}
      </div>

      {hasAccess ? (
        <>
          {/* Basic Tier Section */}
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="rounded-full border border-slate-300/20 bg-slate-300/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300">
                BASIC
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <StaggerGrid className="grid grid-cols-1 gap-3 sm:grid-cols-2" stagger={0.08}>
              {BASIC_MODULES.map((mod) => (
                <StaggerCard key={mod.slug}>
                  <BasicModuleCard mod={mod} />
                </StaggerCard>
              ))}
            </StaggerGrid>
          </div>

          {/* Pro Tier Section */}
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="rounded-full border border-amber-400/25 bg-gradient-to-r from-amber-500/15 via-yellow-400/15 to-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.1)]">
                PRO
              </span>
              <div className="h-px flex-1 bg-amber-400/[0.08]" />
              {!isPro && (
                <Link
                  href="/planes"
                  className="rounded-lg border border-amber-400/15 bg-amber-500/[0.06] px-3 py-1 text-[11px] font-medium text-amber-400/70 transition-all duration-200 hover:border-amber-400/25 hover:bg-amber-500/10 hover:text-amber-300"
                >
                  Desbloquear
                </Link>
              )}
            </div>
            <StaggerGrid className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
              {PRO_MODULES.map((mod) => (
                <StaggerCard key={mod.slug}>
                  <ProModuleCard mod={mod} locked={!isPro} />
                </StaggerCard>
              ))}
            </StaggerGrid>
          </div>
        </>
      ) : (
        /* No plan — show pricing cards inline */
        <div>
          <div className="mb-6 text-center">
            <p className="text-sm text-slate-400">
              Elige un plan para desbloquear los cursos.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Un solo pago. Acceso de por vida.
            </p>
          </div>

          {spotsRemaining > 0 && (
            <div className="mx-auto mb-6 max-w-2xl rounded-xl border border-violet-400/25 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-violet-500/10 px-5 py-3 text-center">
              <p className="text-sm text-violet-200">
                Los primeros <span className="font-bold">{EARLY_PRO_LIMIT} usuarios Pro</span> reciben una beca
                <span className="font-semibold text-emerald-300"> permanente </span>
                para regalar a un amigo
                <span className="ml-1 text-xs text-slate-400">
                  ({spotsRemaining} {spotsRemaining === 1 ? "lugar disponible" : "lugares disponibles"})
                </span>
              </p>
            </div>
          )}

          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            <TierCard
              name={TIERS.basic.name}
              price={TIERS.basic.priceDisplay}
              description={TIERS.basic.description}
              features={[...TIERS.basic.features]}
              tier="basic"
              isCurrentPlan={false}
              isLoggedIn={!!user}
              onCheckoutMp="/api/checkout/tier"
              onCheckoutCrypto="/api/checkout/crypto/tier"
              onCheckoutPaypal="/paypal/pay"
            />
            <TierCard
              name={TIERS.pro.name}
              price={TIERS.pro.priceDisplay}
              description={TIERS.pro.description}
              features={[...TIERS.pro.features]}
              tier="pro"
              highlighted
              isCurrentPlan={false}
              isLoggedIn={!!user}
              onCheckoutMp="/api/checkout/tier"
              onCheckoutCrypto="/api/checkout/crypto/tier"
              onCheckoutPaypal="/paypal/pay"
            />
          </div>

          <div className="mt-4 text-center">
            <Link href="/cursos" className="text-xs text-slate-500 transition hover:text-slate-300">
              O compra cursos individuales →
            </Link>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
