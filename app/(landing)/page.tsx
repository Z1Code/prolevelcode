import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { CoursesSection } from "@/components/landing/courses-section";
import { ProcessSection } from "@/components/landing/process-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { StackSection } from "@/components/landing/stack-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { BarberShowcaseSection } from "@/components/landing/barber-showcase-section";
import { getSiteFeatureFlags } from "@/lib/utils/site-config";
import { prisma } from "@/lib/prisma";
import { testimonials as staticTestimonials } from "@/lib/utils/site-data";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { getBunnyEmbedUrl, getBunnyThumbnailUrl } from "@/lib/bunny/signed-url";

export const metadata: Metadata = {
  title: "ProLevelCode | Desarrollo Web e IA",
  description: "Servicios de desarrollo web, cursos premium de programacion e inteligencia artificial. Aprende a construir productos digitales reales.",
};

async function getTestimonials() {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { is_published: true },
      orderBy: [{ is_featured: "desc" }, { sort_order: "asc" }, { created_at: "desc" }],
      take: 24,
      select: { author_name: true, author_role: true, content: true, user_id: true },
    });
    if (rows.length > 0) {
      const seen = new Set<string>();
      return rows
        .filter((t) => {
          const key = t.user_id ?? t.author_name;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 12)
        .map((t) => ({ name: t.author_name, role: t.author_role || "Estudiante", content: t.content }));
    }
  } catch {}
  return staticTestimonials;
}

async function getBarberShowcase(isPro: boolean) {
  try {
    const project = await prisma.showcaseProject.findFirst({
      where: { is_published: true },
      orderBy: { sort_order: "asc" },
      include: {
        videos: {
          where: { is_published: true },
          orderBy: { sort_order: "asc" },
        },
      },
    });
    if (!project) return null;

    // Build signed embed URLs only for Pro users
    const embedUrls: Record<string, string> = {};
    if (isPro) {
      for (const video of project.videos) {
        try {
          embedUrls[video.bunny_video_id] = getBunnyEmbedUrl(video.bunny_video_id).url;
        } catch {
          // skip if Bunny not configured
        }
      }
    }

    // Ensure thumbnails are populated
    const videos = project.videos.map((v) => ({
      ...v,
      bunny_thumbnail_url: v.bunny_thumbnail_url || getBunnyThumbnailUrl(v.bunny_video_id),
    }));

    return { project: { ...project, videos }, embedUrls };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const flags = await getSiteFeatureFlags();
  const testimonials = flags.showTestimonials ? await getTestimonials() : [];

  const sessionUser = await getSessionUser();
  const tier = sessionUser ? await getUserTier(sessionUser.id) : null;
  const isPro = tier === "pro";

  const barberShowcase = await getBarberShowcase(isPro);

  return (
    <main>
      <HeroSection />
      <ShowcaseSection />
      {flags.showCourses && <CoursesSection />}
      {flags.showProcess && <ProcessSection />}
      {barberShowcase && (
        <BarberShowcaseSection
          project={barberShowcase.project}
          isPro={isPro}
          embedUrls={barberShowcase.embedUrls}
        />
      )}
      {flags.showTestimonials && <TestimonialsSection items={testimonials} />}
      {flags.showStack && <StackSection />}
      {flags.showFinalCta && <FinalCtaSection />}
    </main>
  );
}
