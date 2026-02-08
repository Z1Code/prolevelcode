import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { getCurrentAppUser } from "@/lib/auth/session";
import { getSiteFeatureFlags } from "@/lib/utils/site-config";

export const dynamic = "force-dynamic";

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const [flags, user] = await Promise.all([
    getSiteFeatureFlags(),
    getCurrentAppUser().catch((error) => {
      console.error("[landing/layout] failed to resolve current user", error);
      return null;
    }),
  ]);

  return (
    <div className="landing-bg">
      <Navbar
        showServices={flags.showServices}
        currentUser={user ? { email: user.email, fullName: user.full_name } : null}
      />
      {children}
      <Footer />
    </div>
  );
}
