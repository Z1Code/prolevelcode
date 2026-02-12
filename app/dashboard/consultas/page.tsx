import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { submitProQuery } from "./actions";
import Link from "next/link";

interface ConsultasPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function ConsultasPage({ searchParams }: ConsultasPageProps) {
  const { error, success } = await searchParams;
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  if (currentTier !== "pro") {
    return (
      <div>
        <h2 className="text-2xl font-semibold">Consultas</h2>
        <Card className="mt-4 p-5">
          <p className="text-sm text-slate-400">
            Las consultas directas al instructor son exclusivas del plan Pro.
          </p>
          <Link href="/planes" className="mt-3 inline-block">
            <Button size="sm">Ver plan Pro</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const queries = await prisma.proQuery.findMany({
    where: { user_id: user!.id },
    orderBy: { created_at: "desc" },
    take: 20,
  });

  const pendingCount = queries.filter((q) => q.status === "pending").length;

  const errorMessages: Record<string, string> = {
    "no-pro": "Necesitas un plan Pro para hacer consultas",
    "pregunta-corta": "La consulta debe tener al menos 10 caracteres",
    "pregunta-larga": "La consulta no puede superar 1000 caracteres",
    "limite-pendientes": "Ya tienes 3 consultas pendientes. Espera a que sean respondidas.",
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Consultas al instructor</h2>
      <p className="mt-1 text-sm text-slate-400">
        Haz preguntas directas y concisas. Mientras mas especifica sea tu consulta, mejor sera la respuesta.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessages[error] ?? "Ocurrio un error"}
        </div>
      )}

      {success === "enviada" && (
        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Consulta enviada. Recibiras una respuesta pronto.
        </div>
      )}

      <Card className="mt-4 p-5">
        <h3 className="font-semibold">Nueva consulta</h3>
        <p className="mt-1 text-xs text-slate-500">
          Se lo mas directo/a posible. Ejemplo: &quot;Como desplegar una app Next.js en un VPS con Docker?&quot;
        </p>

        {pendingCount >= 3 ? (
          <p className="mt-3 text-sm text-amber-300">
            Tienes 3 consultas pendientes. Espera a que sean respondidas antes de enviar otra.
          </p>
        ) : (
          <form action={submitProQuery} className="mt-3">
            <textarea
              name="question"
              required
              minLength={10}
              maxLength={1000}
              rows={3}
              placeholder="Escribe tu consulta aqui..."
              className="w-full rounded-xl border border-slate-600/50 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] text-slate-500">Min 10, max 1000 caracteres</p>
              <Button type="submit" size="sm">Enviar consulta</Button>
            </div>
          </form>
        )}
      </Card>

      {queries.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold">Mis consultas</h3>
          {queries.map((q) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-200">{q.question}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  q.status === "answered"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-300"
                }`}>
                  {q.status === "answered" ? "Respondida" : "Pendiente"}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {new Date(q.created_at).toLocaleDateString("es-ES", { dateStyle: "medium" })}
              </p>
              {q.answer && (
                <div className="mt-3 rounded-lg border border-violet-400/15 bg-violet-500/5 p-3">
                  <p className="text-xs font-medium text-violet-300">Respuesta del instructor:</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{q.answer}</p>
                  {q.answered_at && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      {new Date(q.answered_at).toLocaleDateString("es-ES", { dateStyle: "medium" })}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
