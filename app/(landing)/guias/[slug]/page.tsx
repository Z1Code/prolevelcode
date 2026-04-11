import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Lock } from "lucide-react";
import { getGuideBySlug, getAdjacentGuides, getPhaseForGuide } from "@/lib/guides/helpers";
import { GuideStepper } from "@/components/guides/guide-stepper";
import { GuideNav } from "@/components/guides/guide-nav";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import type { TierLevel } from "@/lib/guides/types";

const tierRank: Record<TierLevel, number> = { free: 0, basic: 1, pro: 2 };

function canAccess(userTier: TierLevel | null, required: TierLevel): boolean {
  if (required === "free") return true;
  if (!userTier) return false;
  return tierRank[userTier] >= tierRank[required];
}

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return {
    title: `${guide.title} — Guias ProLevelCode`,
    description: guide.description,
  };
}

export default async function GuideDetailPage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect(`/login?next=/guias/${slug}`);
  }

  const rawTier = await getUserTier(sessionUser.id);
  const userTier: TierLevel = rawTier ?? "free";

  if (!canAccess(userTier, guide.tier)) {
    return (
      <main className="container-wide section-spacing liquid-section">
        <div className="mx-auto max-w-md py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Lock className="h-6 w-6 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Acceso restringido</h1>
          <p className="mt-2 text-sm text-slate-400">
            Esta guia requiere el plan{" "}
            <span className={guide.tier === "pro" ? "text-violet-400 font-semibold" : "text-emerald-400 font-semibold"}>
              {guide.tier === "pro" ? "Pro" : "Basic"}
            </span>{" "}
            para acceder.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/guias"
              className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Volver a guias
            </Link>
            <Link
              href="/planes"
              className={`inline-flex h-10 items-center rounded-full border px-5 text-sm font-semibold transition ${
                guide.tier === "pro"
                  ? "border-violet-500/30 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25"
                  : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
              }`}
            >
              Ver planes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const phase = getPhaseForGuide(slug);
  const { prev, next } = getAdjacentGuides(slug);

  return (
    <main className="container-wide section-spacing liquid-section">
      <div className="mx-auto max-w-2xl">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/guias" className="inline-flex items-center gap-1.5 transition hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            Guias
          </Link>
          <span>/</span>
          {phase && <span>Fase {phase.number}</span>}
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold md:text-4xl">{guide.title}</h1>
          <p className="mt-3 text-slate-400">{guide.description}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {guide.estimatedMinutes} min
            </span>
            <span>{guide.steps.length} pasos</span>
          </div>
        </div>

        {/* Steps */}
        <GuideStepper steps={guide.steps} />

        {/* Navigation */}
        <GuideNav prev={prev} next={next} />
      </div>
    </main>
  );
}
