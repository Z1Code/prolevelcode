import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { applyForScholarship } from "./actions";
import Link from "next/link";

interface BecasPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function BecasPage({ searchParams }: BecasPageProps) {
  const { error, success } = await searchParams;
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  // Count available pool scholarships
  const availableCount = await prisma.scholarship.count({
    where: {
      status: "unassigned",
      pool_available_at: { lte: new Date() },
    },
  });

  // Check user's application status
  const myApplication = user
    ? await prisma.scholarshipApplication.findFirst({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
      })
    : null;

  // Check if user already has a scholarship
  const myScholarship = user
    ? await prisma.scholarship.findFirst({
        where: { recipient_user_id: user.id, status: "active" },
        select: { scholarship_code: true, expires_at: true },
      })
    : null;

  const errorMessages: Record<string, string> = {
    "razon-corta": "Tu mensaje debe tener al menos 20 caracteres. Se directo pero explica bien tu situacion.",
    "razon-larga": "Tu mensaje no puede superar 500 caracteres.",
    "ya-tiene-plan": "Ya tienes un plan activo. Las becas son para quienes no tienen acceso.",
    "ya-aplicaste": "Ya tienes una aplicacion pendiente. Espera a que sea revisada.",
    "ya-tiene-beca": "Ya tienes una beca activa.",
  };

  return (
    <main className="container-wide section-spacing liquid-section">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">Becas</h1>
        <p className="mt-3 text-slate-300">
          Acceso gratuito a los cursos Basic de ProLevelCode para quienes lo necesiten.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessages[error] ?? "Ocurrio un error"}
          </div>
        )}
        {success === "aplicacion-enviada" && (
          <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Aplicacion enviada. Te notificaremos cuando sea revisada.
          </div>
        )}

        {/* ── How it works ── */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold">Como funciona</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">1</span>
              <div>
                <p className="font-medium text-white">Los usuarios Pro generan becas</p>
                <p className="mt-0.5 text-slate-400">
                  Cada compra del plan Pro ($99) incluye una beca para regalar acceso Basic a otra persona.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">2</span>
              <div>
                <p className="font-medium text-white">Asignacion directa o pool</p>
                <p className="mt-0.5 text-slate-400">
                  El usuario Pro puede compartir su beca directamente con un amigo. Si no la asigna en 7 dias, la beca entra al pool publico.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">3</span>
              <div>
                <p className="font-medium text-white">Aplica y explica tu situacion</p>
                <p className="mt-0.5 text-slate-400">
                  Registrate y escribe un mensaje breve y directo explicando por que te gustaria recibir la beca. Se lo mas concreto posible.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">4</span>
              <div>
                <p className="font-medium text-white">Asignacion automatica o manual</p>
                <p className="mt-0.5 text-slate-400">
                  Cuando hay becas disponibles en el pool, se asignan automaticamente por orden de aplicacion. El administrador tambien puede asignarlas manualmente.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300">5</span>
              <div>
                <p className="font-medium text-white">El usuario Pro recibe tu mensaje</p>
                <p className="mt-0.5 text-slate-400">
                  Cuando tu beca es asignada, el usuario Pro que la genero recibe tu mensaje sobre por que la mereces. Es una forma de conectar a la comunidad.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Available scholarships counter ── */}
        <Card className="mt-6 p-5">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Becas disponibles en el pool</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              availableCount > 0
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-slate-500/15 text-slate-400"
            }`}>
              {availableCount}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {availableCount > 0
              ? "Hay becas disponibles. Aplica y podras recibir una automaticamente."
              : "No hay becas disponibles ahora. Aplica y cuando haya una disponible se te asignara por orden de llegada."}
          </p>
        </Card>

        {/* ── User status ── */}
        {myScholarship && (
          <Card className="mt-6 border-emerald-400/20 bg-emerald-500/5 p-5">
            <h3 className="font-semibold text-emerald-300">Ya tienes una beca activa</h3>
            <p className="mt-1 text-sm text-slate-400">
              Codigo: <span className="font-mono text-slate-300">{myScholarship.scholarship_code}</span>
              {myScholarship.expires_at
                ? ` · Expira: ${new Date(myScholarship.expires_at).toLocaleDateString("es-ES")}`
                : " · Permanente"}
            </p>
            <Link href="/dashboard/cursos" className="mt-3 inline-block">
              <Button size="sm">Ir a mis cursos</Button>
            </Link>
          </Card>
        )}

        {currentTier && !myScholarship && (
          <Card className="mt-6 p-5">
            <p className="text-sm text-slate-400">Ya tienes un plan activo ({currentTier}). Las becas son para quienes no tienen acceso.</p>
          </Card>
        )}

        {/* ── Application form (visible to everyone without tier/scholarship) ── */}
        {!currentTier && !myScholarship && (
          <Card className="mt-6 p-6">
            <h2 className="text-xl font-semibold">Aplicar a una beca</h2>

            {user && myApplication?.status === "pending" ? (
              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
                <p className="text-sm text-amber-200">Tu aplicacion esta en revision.</p>
                <p className="mt-2 text-xs text-slate-400">
                  Enviada el {new Date(myApplication.created_at).toLocaleDateString("es-ES")}
                </p>
                <p className="mt-2 rounded-lg bg-white/5 p-3 text-xs italic text-slate-400">
                  &quot;{myApplication.reason}&quot;
                </p>
              </div>
            ) : user && myApplication?.status === "rejected" ? (
              <div className="mt-4">
                <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/5 p-3">
                  <p className="text-sm text-red-300">Tu aplicacion anterior no fue aprobada. Puedes intentar de nuevo.</p>
                </div>
                <ApplicationForm />
              </div>
            ) : user ? (
              <div className="mt-4">
                <ApplicationForm />
              </div>
            ) : (
              <div className="mt-4">
                <ApplicationForm disabled />
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-500/5 px-4 py-3">
                  <p className="text-sm text-slate-300">Registrate para enviar tu aplicacion.</p>
                  <div className="ml-auto flex shrink-0 gap-2">
                    <Link href="/registro?next=/becas">
                      <Button size="sm">Registrarse</Button>
                    </Link>
                    <Link href="/login?next=/becas">
                      <Button size="sm" variant="ghost">Login</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}

function ApplicationForm({ disabled }: { disabled?: boolean }) {
  return (
    <form action={disabled ? undefined : applyForScholarship}>
      <p className="text-xs text-slate-500">
        Escribe un mensaje directo y concreto. Ejemplo: &quot;Soy estudiante de ingenieria y quiero aprender React para mi proyecto de tesis.&quot;
      </p>
      <textarea
        name="reason"
        required={!disabled}
        disabled={disabled}
        minLength={20}
        maxLength={500}
        rows={4}
        placeholder="Explica brevemente por que te gustaria recibir la beca..."
        className="mt-3 w-full rounded-xl border border-slate-600/50 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {!disabled && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-slate-500">Min 20, max 500 caracteres</p>
          <Button type="submit" size="sm">Enviar aplicacion</Button>
        </div>
      )}
    </form>
  );
}
