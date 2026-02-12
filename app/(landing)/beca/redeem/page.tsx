import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EARLY_PRO_LIMIT } from "@/lib/tiers/config";
import Link from "next/link";

interface RedeemPageProps {
  searchParams: Promise<{ token?: string }>;
}

async function redeemScholarship(token: string, userId: string) {
  const scholarship = await prisma.scholarship.findUnique({
    where: { invite_token: token },
    include: { tierPurchase: true },
  });

  if (!scholarship || scholarship.status !== "pending") {
    return { error: "invalid" as const };
  }

  // Check if the grantor's Pro purchase is among the first N → permanent scholarship
  const firstProPurchases = await prisma.tierPurchase.findMany({
    where: { tier: "pro", status: "active" },
    orderBy: { purchased_at: "asc" },
    take: EARLY_PRO_LIMIT,
    select: { id: true },
  });

  const isPermanent = firstProPurchases.some((p) => p.id === scholarship.tier_purchase_id);

  const now = new Date();
  const expiresAt = isPermanent
    ? null // lifetime
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.scholarship.update({
    where: { id: scholarship.id },
    data: {
      recipient_user_id: userId,
      status: "active",
      redeemed_at: now,
      expires_at: expiresAt,
    },
  });

  return { success: true as const, isPermanent };
}

export default async function RedeemBecaPage({ searchParams }: RedeemPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="container-wide section-spacing liquid-section">
        <Card className="mx-auto max-w-lg p-6">
          <h1 className="text-2xl font-bold">Beca invalida</h1>
          <p className="mt-2 text-sm text-slate-400">No se proporciono un token de beca.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button size="sm">Ir al inicio</Button>
          </Link>
        </Card>
      </main>
    );
  }

  // Validate token
  const scholarship = await prisma.scholarship.findUnique({
    where: { invite_token: token },
    include: { grantor: { select: { full_name: true, email: true } } },
  });

  if (!scholarship) {
    return (
      <main className="container-wide section-spacing liquid-section">
        <Card className="mx-auto max-w-lg p-6">
          <h1 className="text-2xl font-bold">Beca no encontrada</h1>
          <p className="mt-2 text-sm text-slate-400">Este enlace de beca no es valido.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button size="sm">Ir al inicio</Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (scholarship.status !== "pending") {
    const statusMsg = {
      active: "Esta beca ya fue activada.",
      expired: "Esta beca ha expirado.",
      revoked: "Esta beca fue revocada por el otorgante.",
    }[scholarship.status] ?? "Esta beca no esta disponible.";

    return (
      <main className="container-wide section-spacing liquid-section">
        <Card className="mx-auto max-w-lg p-6">
          <h1 className="text-2xl font-bold">Beca no disponible</h1>
          <p className="mt-2 text-sm text-slate-400">{statusMsg}</p>
          <Link href="/" className="mt-4 inline-block">
            <Button size="sm">Ir al inicio</Button>
          </Link>
        </Card>
      </main>
    );
  }

  const user = await getSessionUser();

  if (!user) {
    // Redirect to registration with scholarship token
    redirect(`/registro?scholarship=${token}`);
  }

  // User is logged in: redeem immediately
  const result = await redeemScholarship(token, user.id);

  if (result.error) {
    return (
      <main className="container-wide section-spacing liquid-section">
        <Card className="mx-auto max-w-lg p-6">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="mt-2 text-sm text-slate-400">No se pudo activar la beca.</p>
        </Card>
      </main>
    );
  }

  const durationText = result.isPermanent
    ? "acceso permanente (de por vida)"
    : "30 dias de acceso";

  return (
    <main className="container-wide section-spacing liquid-section">
      <Card className="mx-auto max-w-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-emerald-300">Beca activada</h1>
        <p className="mt-2 text-sm text-slate-400">
          Tienes {durationText} a los cursos Basic de ProLevelCode.
          {scholarship.grantor.full_name && (
            <> Gracias a {scholarship.grantor.full_name}.</>
          )}
        </p>
        <Link href="/dashboard/cursos" className="mt-4 inline-block">
          <Button>Ir a mis cursos</Button>
        </Link>
      </Card>
    </main>
  );
}
