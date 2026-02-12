import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { EARLY_PRO_LIMIT } from "@/lib/tiers/config";
import { grantScholarship, revokeScholarship } from "./actions";
import Link from "next/link";

interface BecaPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function BecaPage({ searchParams }: BecaPageProps) {
  const { error, success } = await searchParams;
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  if (currentTier !== "pro") {
    return (
      <div>
        <h2 className="text-2xl font-semibold">Becas</h2>
        <Card className="mt-4 p-5">
          <p className="text-sm text-slate-400">
            Solo los usuarios Pro pueden otorgar becas.
          </p>
          <Link href="/planes" className="mt-3 inline-block">
            <Button size="sm">Upgrade a Pro</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Determine if user is early Pro
  const proTier = await prisma.tierPurchase.findFirst({
    where: { user_id: user!.id, tier: "pro", status: "active" },
    select: { id: true },
  });

  const firstProPurchases = await prisma.tierPurchase.findMany({
    where: { tier: "pro", status: "active" },
    orderBy: { purchased_at: "asc" },
    take: EARLY_PRO_LIMIT,
    select: { id: true },
  });

  const isEarlyPro = proTier
    ? firstProPurchases.some((p) => p.id === proTier.id)
    : false;

  const scholarships = await prisma.scholarship.findMany({
    where: { grantor_id: user!.id },
    orderBy: { granted_at: "desc" },
    include: { recipient: { select: { email: true } } },
  });

  const errorMessages: Record<string, string> = {
    "email-requerido": "El email del destinatario es requerido",
    "no-pro": "Necesitas un plan Pro activo para otorgar becas",
    "ya-otorgada": "Ya has otorgado una beca con esta compra",
    "no-auto-beca": "No puedes otorgarte una beca a ti mismo",
  };

  const becaDescription = isEarlyPro
    ? "Como uno de los primeros 6 usuarios Pro, tu beca otorga acceso Basic permanente (de por vida)."
    : "Como usuario Pro, puedes otorgar una beca de 30 dias de acceso Basic.";

  return (
    <div>
      <h2 className="text-2xl font-semibold">Becas</h2>
      <p className="mt-1 text-sm text-slate-400">{becaDescription}</p>

      {isEarlyPro && (
        <div className="mt-3 rounded-xl border border-violet-400/25 bg-violet-500/5 px-4 py-2.5 text-xs text-violet-300">
          Tu beca es permanente porque eres de los primeros 6 Pro de la plataforma.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessages[error] ?? "Ocurrio un error"}
        </div>
      )}

      {success === "otorgada" && (
        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Beca otorgada exitosamente. Se envio un email al destinatario.
        </div>
      )}

      <Card className="mt-4 p-5">
        <h3 className="font-semibold">Otorgar beca</h3>
        <form action={grantScholarship} className="mt-3 flex gap-3">
          <Input
            name="recipientEmail"
            type="email"
            placeholder="email@amigo.com"
            required
            className="max-w-sm"
          />
          <Button type="submit">Enviar beca</Button>
        </form>
      </Card>

      {scholarships.length > 0 && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Becas otorgadas</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {scholarships.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <div>
                  <p className="text-slate-300">{s.recipient_email}</p>
                  <p className="text-xs text-slate-500">
                    {s.status === "pending" && "Pendiente de redencion"}
                    {s.status === "active" && (
                      s.expires_at
                        ? `Activa - Expira: ${new Date(s.expires_at).toLocaleDateString("es-ES")}`
                        : "Activa - Permanente"
                    )}
                    {s.status === "expired" && "Expirada"}
                    {s.status === "revoked" && "Revocada"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    s.status === "active" ? "bg-emerald-500/15 text-emerald-300"
                    : s.status === "pending" ? "bg-amber-500/15 text-amber-300"
                    : "bg-slate-500/15 text-slate-400"
                  }`}>
                    {s.status}
                  </span>
                  {(s.status === "pending" || s.status === "active") && (
                    <form action={revokeScholarship}>
                      <input type="hidden" name="scholarshipId" value={s.id} />
                      <Button type="submit" variant="danger" size="sm">Revocar</Button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
