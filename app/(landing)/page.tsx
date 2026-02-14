import { HeroSection } from "@/components/landing/hero-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { CoursesSection } from "@/components/landing/courses-section";
import { ProcessSection } from "@/components/landing/process-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { StackSection } from "@/components/landing/stack-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { getSiteFeatureFlags } from "@/lib/utils/site-config";

export default async function HomePage() {
  const flags = await getSiteFeatureFlags();

  return (
    <main>
      <HeroSection />
      <ShowcaseSection />
      {flags.showCourses && <CoursesSection />}
      {flags.showProcess && <ProcessSection />}
      {flags.showTestimonials && <TestimonialsSection />}
      {flags.showStack && <StackSection />}
      {flags.showFinalCta && <FinalCtaSection />}
    </main>
  );
}
