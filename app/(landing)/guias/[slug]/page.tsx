import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getGuideBySlug, getAdjacentGuides, getPhaseForGuide, getAllGuideSlugs } from "@/lib/guides/helpers";
import { GuideStepper } from "@/components/guides/guide-stepper";
import { GuideNav } from "@/components/guides/guide-nav";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
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
