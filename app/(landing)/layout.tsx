import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { getSiteFeatureFlags } from "@/lib/utils/site-config";

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const flags = await getSiteFeatureFlags();

  return (
    <div className="landing-bg">
      <Navbar showServices={flags.showServices} />
      {children}
      <Footer />
    </div>
  );
}
