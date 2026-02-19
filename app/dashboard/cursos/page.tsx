import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { DashboardShell, StaggerGrid, StaggerCard } from "@/components/dashboard/dashboard-shell";
import { TierCard } from "@/components/pricing/tier-card";
import { TIERS, EARLY_PRO_LIMIT } from "@/lib/tiers/config";
import { prisma } from "@/lib/prisma";
import { BASIC_MODULES, PRO_MODULES } from "@/lib/courses/curriculum";
import type { CurriculumModuleData } from "@/lib/courses/curriculum";
import { CurriculumIcon } from "@/components/courses/curriculum-icon";

/* ── Card components ── */

function BasicModuleCard({ mod, slug }: { mod: CurriculumModuleData; slug: string | null }) {
  const isAvailable = !!slug;

  const content = (
    <div className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-200 ${isAvailable ? "border-white/[0.08] bg-white/[0.03] hover:border-emerald-400/20 hover:bg-white/[0.05] hover:shadow-[0_0_24px_rgba(52,211,153,0.06)]" : "border-white/[0.05] bg-white/[0.02]"}`}>
      <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent ${isAvailable ? "opacity-0 transition-opacity duration-300 group-hover:opacity-100" : "opacity-0"}`} />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isAvailable ? "bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/15" : "bg-white/[0.04] text-slate-600"}`}>
            <CurriculumIcon icon={mod.icon} />
          </div>
          {isAvailable ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-400">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="rounded-full border border-slate-500/20 bg-slate-600/10 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Pronto
            </span>
          )}
        </div>
        <h3 className={`text-sm font-semibold ${isAvailable ? "text-slate-200 transition-colors group-hover:text-white" : "text-slate-400"}`}>
          {mod.title}
        </h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${isAvailable ? "text-slate-500" : "text-slate-600"}`}>
          {mod.description}
        </p>
      </div>
    </div>
  );

  if (isAvailable) {
    return <Link href={`/dashboard/cursos/${slug}`} className="block">{content}</Link>;
  }
  return content;
}

function ProModuleCard({ mod, slug, locked }: { mod: CurriculumModuleData; slug: string | null; locked: boolean }) {
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

  const isAvailable = !!slug;

  const content = (
    <div className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br from-amber-500/[0.04] via-white/[0.02] to-transparent p-5 transition-all duration-200 ${isAvailable ? "border-amber-400/[0.12] hover:border-amber-400/25 hover:shadow-[0_0_24px_rgba(251,191,36,0.08)]" : "border-amber-400/[0.06]"}`}>
      <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-transparent ${isAvailable ? "opacity-0 transition-opacity duration-300 group-hover:opacity-100" : "opacity-0"}`} />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isAvailable ? "bg-amber-500/10 text-amber-400 transition-colors group-hover:bg-amber-500/15" : "bg-amber-500/[0.06] text-amber-500/40"}`}>
            <CurriculumIcon icon={mod.icon} />
          </div>
          {isAvailable ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-600/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-amber-400">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="rounded-full border border-amber-400/15 bg-amber-500/[0.06] px-2 py-0.5 text-[10px] font-medium text-amber-400/50">
              Pronto
            </span>
          )}
        </div>
        <h3 className={`text-sm font-semibold ${isAvailable ? "text-amber-200 transition-colors group-hover:text-amber-100" : "text-amber-300/50"}`}>
          {mod.title}
        </h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${isAvailable ? "text-amber-400/40" : "text-amber-400/25"}`}>
          {mod.description}
        </p>
      </div>
    </div>
  );

  if (isAvailable) {
    return <Link href={`/dashboard/cursos/${slug}`} className="block">{content}</Link>;
  }
  return content;
}

/* ── Page ── */

export default async function DashboardCoursesPage() {
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;
  const isPro = currentTier === "pro";
  const hasAccess = currentTier === "basic" || currentTier === "pro";

  // Fetch published courses to match slugs dynamically
  const publishedCourses = await prisma.course.findMany({
    where: { is_published: true, is_coming_soon: false },
    select: { slug: true },
  });
  const publishedSlugs = new Set(publishedCourses.map((c) => c.slug));

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

  /** Returns the slug only if the course is published */
  function resolveSlug(mod: CurriculumModuleData): string | null {
    return publishedSlugs.has(mod.defaultSlug) ? mod.defaultSlug : null;
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
                <StaggerCard key={mod.key}>
                  <BasicModuleCard mod={mod} slug={resolveSlug(mod)} />
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
                <StaggerCard key={mod.key}>
                  <ProModuleCard mod={mod} slug={resolveSlug(mod)} locked={!isPro} />
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
