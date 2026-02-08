import { HeroSection } from "@/components/landing/hero-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { ServicesSection } from "@/components/landing/services-section";
import { CoursesSection } from "@/components/landing/courses-section";
import { ProcessSection } from "@/components/landing/process-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { StackSection } from "@/components/landing/stack-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { ServicesVisibility } from "@/components/landing/services-visibility";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ShowcaseSection />
      <ServicesVisibility>
        <ServicesSection />
      </ServicesVisibility>
      <CoursesSection />
      <ProcessSection />
      <TestimonialsSection />
      <StackSection />
      <FinalCtaSection />
    </main>
  );
}
