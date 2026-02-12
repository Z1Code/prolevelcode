import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { answerProQuery } from "../actions";

export default async function AdminConsultasPage() {
  const queries = await prisma.proQuery.findMany({
    orderBy: [{ status: "asc" }, { created_at: "desc" }],
    take: 100,
    include: {
      user: { select: { email: true, full_name: true } },
    },
  });

  const pending = queries.filter((q) => q.status === "pending");
  const answered = queries.filter((q) => q.status === "answered");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Consultas Pro</h2>

      {/* ── Pending queries ── */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Pendientes</h3>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No hay consultas pendientes.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {pending.map((q) => (
              <div key={q.id} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">
                      {q.user.email}
                      {q.user.full_name && <span className="text-slate-500"> ({q.user.full_name})</span>}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{q.question}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {q.created_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </div>

                <form action={answerProQuery} className="mt-3">
                  <input type="hidden" name="id" value={q.id} />
                  <textarea
                    name="answer"
                    required
                    rows={3}
                    placeholder="Escribe tu respuesta..."
                    className="w-full rounded-xl border border-slate-600/50 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button type="submit" size="sm">Responder</Button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Answered queries ── */}
      <Card className="p-4">
        <h3 className="font-semibold">Respondidas ({answered.length})</h3>
        {answered.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin consultas respondidas aun.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {answered.map((q) => (
              <div key={q.id} className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  {q.user.email}
                  {q.user.full_name && <span className="text-slate-500"> ({q.user.full_name})</span>}
                  <span className="ml-2 text-slate-600">
                    {q.created_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </p>
                <p className="mt-2 text-sm text-slate-300">{q.question}</p>
                <div className="mt-2 rounded-lg border border-violet-400/15 bg-violet-500/5 p-3">
                  <p className="whitespace-pre-wrap text-sm text-slate-200">{q.answer}</p>
                  {q.answered_at && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      Respondida: {q.answered_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
