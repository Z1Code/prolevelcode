import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { EARLY_PRO_LIMIT } from "@/lib/tiers/config";
import { env } from "@/lib/env";
import { assignScholarship, revokeScholarship } from "./actions";
import { CopyButton } from "@/components/ui/copy-button";
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
      <div className="page-enter">
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

  // Get user's scholarships
  const scholarships = await prisma.scholarship.findMany({
    where: { grantor_id: user!.id },
    orderBy: { granted_at: "desc" },
    include: { recipient: { select: { email: true, full_name: true } } },
  });

  // Check if early Pro
  const proTier = await prisma.tierPurchase.findFirst({
    where: { user_id: user!.id, tier: "pro", status: "active" },
    select: { id: true },
  });
  const firstPro = await prisma.tierPurchase.findMany({
    where: { tier: "pro", status: "active" },
    orderBy: { purchased_at: "asc" },
    take: EARLY_PRO_LIMIT,
    select: { id: true },
  });
  const isEarlyPro = proTier ? firstPro.some((p) => p.id === proTier.id) : false;

  const unassigned = scholarships.filter((s) => s.status === "unassigned");
  const pending = scholarships.filter((s) => s.status === "pending");
  const active = scholarships.filter((s) => s.status === "active");
  const others = scholarships.filter((s) => s.status === "expired" || s.status === "revoked");

  const errorMessages: Record<string, string> = {
    "datos-requeridos": "El email del destinatario es requerido",
    "no-auto-beca": "No puedes otorgarte una beca a ti mismo",
    "beca-no-disponible": "Esta beca ya no esta disponible",
  };

  return (
    <div className="page-enter">
      <h2 className="text-2xl font-semibold">Mis becas</h2>
      <p className="mt-1 text-sm text-slate-400">
        {isEarlyPro
          ? "Tus becas son permanentes (de por vida) por ser de los primeros 6 Pro."
          : "Cada compra Pro incluye 1 beca de 30 dias de acceso Basic para un amigo."}
      </p>

      {isEarlyPro && (
        <div className="mt-3 rounded-xl border border-violet-400/25 bg-violet-500/5 px-4 py-2.5 text-xs text-violet-300">
          Tus becas otorgan acceso permanente. Si no la asignas en 7 dias, sera asignada automaticamente a un aspirante.
        </div>
      )}

      {error && (
        <div className="mt-4 alert-enter rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessages[error] ?? "Ocurrio un error"}
        </div>
      )}
      {success === "asignada" && (
        <div className="mt-4 alert-enter rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Beca asignada exitosamente. Se envio un email al destinatario.
        </div>
      )}

      {/* ── Unassigned scholarships: share link or assign by email ── */}
      {unassigned.map((s) => {
        const shareLink = `${env.appUrl}/beca/redeem?token=${s.invite_token}`;
        const daysLeft = Math.max(0, Math.ceil((s.pool_available_at.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

        return (
          <Card key={s.id} className="mt-4 border-amber-400/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">Beca disponible</h3>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                {s.scholarship_code}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {daysLeft > 0
                ? `Tienes ${daysLeft} dia${daysLeft !== 1 ? "s" : ""} para asignarla antes de que entre al pool de becas.`
                : "Esta beca ya esta en el pool y puede ser asignada automaticamente."}
            </p>

            {/* Shareable link */}
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-300">Link para compartir:</p>
              <div className="mt-1 flex items-center gap-2">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 truncate rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300"
                />
                <CopyButton text={shareLink} />
              </div>
            </div>

            {/* Or assign by email */}
            <div className="mt-4 border-t border-slate-600/30 pt-4">
              <p className="text-xs font-medium text-slate-300">O asignar por email:</p>
              <form action={assignScholarship} className="mt-2 flex gap-3">
                <input type="hidden" name="scholarshipId" value={s.id} />
                <Input
                  name="recipientEmail"
                  type="email"
                  placeholder="email@amigo.com"
                  required
                  className="max-w-sm"
                />
                <Button type="submit" size="sm">Enviar</Button>
              </form>
            </div>
          </Card>
        );
      })}

      {/* ── Pending (assigned but not redeemed) ── */}
      {pending.length > 0 && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Pendientes de activacion</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {pending.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">{s.scholarship_code}</span>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">Pendiente</span>
                  </div>
                  <p className="mt-1 text-slate-300">{s.recipient_email}</p>
                </div>
                <form action={revokeScholarship}>
                  <input type="hidden" name="scholarshipId" value={s.id} />
                  <Button type="submit" variant="danger" size="sm">Revocar</Button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Active ── */}
      {active.length > 0 && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Becas activas</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {active.map((s) => (
              <li key={s.id} className="rounded-lg bg-white/5 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{s.scholarship_code}</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">Activa</span>
                  {!s.expires_at && (
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">Permanente</span>
                  )}
                </div>
                <p className="mt-1 text-slate-300">{s.recipient?.email ?? s.recipient_email}</p>
                {s.applicant_reason && (
                  <p className="mt-2 rounded-lg border border-slate-600/30 bg-white/5 p-2 text-xs italic text-slate-400">
                    &quot;{s.applicant_reason}&quot;
                  </p>
                )}
                <p className="mt-1 text-[10px] text-slate-500">
                  {s.expires_at
                    ? `Expira: ${new Date(s.expires_at).toLocaleDateString("es-ES")}`
                    : "Sin fecha de expiracion"}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Expired/Revoked ── */}
      {others.length > 0 && (
        <Card className="mt-4 p-5">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-slate-400 hover:text-white transition">
              Expiradas/Revocadas ({others.length})
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              {others.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-slate-500">
                  <span>{s.scholarship_code} — {s.recipient_email ?? "Sin asignar"}</span>
                  <span className="text-[10px]">{s.status}</span>
                </li>
              ))}
            </ul>
          </details>
        </Card>
      )}

      {scholarships.length === 0 && (
        <Card className="mt-4 p-5">
          <p className="text-sm text-slate-500">Aun no tienes becas. Se crean automaticamente al comprar el plan Pro.</p>
        </Card>
      )}
    </div>
  );
}

