import { HeroSection } from "@/components/landing/hero-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { CoursesSection } from "@/components/landing/courses-section";
import { ProcessSection } from "@/components/landing/process-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { StackSection } from "@/components/landing/stack-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { getSiteFeatureFlags } from "@/lib/utils/site-config";
import { prisma } from "@/lib/prisma";
import { testimonials as staticTestimonials } from "@/lib/utils/site-data";

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

export default async function HomePage() {
  const flags = await getSiteFeatureFlags();
  const testimonials = flags.showTestimonials ? await getTestimonials() : [];

  return (
    <main>
      <HeroSection />
      <ShowcaseSection />
      {flags.showCourses && <CoursesSection />}
      {flags.showProcess && <ProcessSection />}
      {flags.showTestimonials && <TestimonialsSection items={testimonials} />}
      {flags.showStack && <StackSection />}
      {flags.showFinalCta && <FinalCtaSection />}
    </main>
  );
}
