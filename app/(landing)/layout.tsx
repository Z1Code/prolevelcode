import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { getCurrentAppUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
export const dynamic = "force-dynamic";

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAppUser().catch((error) => {
    console.error("[landing/layout] failed to resolve current user", error);
    return null;
  });

  const userTier = user ? await getUserTier(user.id).catch(() => null) : null;

  return (
    <div className="landing-bg">
      <Navbar
        currentUser={user ? { email: user.email, fullName: user.full_name } : null}
        userTier={userTier}
      />
      {children}
      <Footer />
    </div>
  );
}
