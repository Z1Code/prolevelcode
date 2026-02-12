import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isEarlyProScholarship } from "@/lib/scholarships/helpers";
import Link from "next/link";

interface RedeemPageProps {
  searchParams: Promise<{ token?: string }>;
}

async function redeemScholarship(token: string, userId: string) {
  const scholarship = await prisma.scholarship.findUnique({
    where: { invite_token: token },
  });

  if (!scholarship || (scholarship.status !== "pending" && scholarship.status !== "unassigned")) {
    return { error: "invalid" as const };
  }

  const isPermanent = await isEarlyProScholarship(scholarship.tier_purchase_id);
  const now = new Date();
  const expiresAt = isPermanent ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  await prisma.scholarship.update({
    where: { id: scholarship.id },
    data: {
      recipient_user_id: userId,
      recipient_email: user?.email ?? scholarship.recipient_email,
      status: "active",
      assigned_at: scholarship.assigned_at ?? now,
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

  if (scholarship.status !== "pending" && scholarship.status !== "unassigned") {
    const statusMsg = {
      active: "Esta beca ya fue activada.",
      expired: "Esta beca ha expirado.",
      revoked: "Esta beca fue revocada.",
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
    redirect(`/registro?scholarship=${token}`);
  }

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
        <div className="text-5xl">🎉</div>
        <h1 className="mt-3 text-2xl font-bold text-emerald-300">Beca activada</h1>
        <p className="mt-1 text-xs font-mono text-slate-500">{scholarship.scholarship_code}</p>
        <p className="mt-3 text-sm text-slate-300">
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
