import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { adminAssignScholarship, adminRejectApplication, adminGrantScholarshipDirect } from "../actions";
import { SendWelcomeButton } from "./send-welcome-button";

export default async function AdminBecasPage() {
  // Pending applications
  const applications = await prisma.scholarshipApplication.findMany({
    where: { status: "pending" },
    orderBy: { created_at: "asc" },
    include: { user: { select: { email: true, full_name: true } } },
  });

  // Available pool scholarships (unassigned + past pool date)
  const poolScholarships = await prisma.scholarship.findMany({
    where: {
      status: "unassigned",
      pool_available_at: { lte: new Date() },
    },
    orderBy: { granted_at: "asc" },
    include: { grantor: { select: { email: true } } },
  });

  // All scholarships for overview
  const allScholarships = await prisma.scholarship.findMany({
    orderBy: { granted_at: "desc" },
    take: 50,
    include: {
      grantor: { select: { email: true } },
      recipient: { select: { email: true } },
    },
  });

  // Recent approved/rejected applications
  const reviewedApps = await prisma.scholarshipApplication.findMany({
    where: { status: { in: ["approved", "rejected"] } },
    orderBy: { reviewed_at: "desc" },
    take: 20,
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Becas</h2>
        <SendWelcomeButton />
      </div>

      {/* ── Pending applications + available scholarships to assign ── */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Aplicaciones pendientes</h3>
          {applications.length > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
              {applications.length}
            </span>
          )}
        </div>

        {applications.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No hay aplicaciones pendientes.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">
                      {app.user.email}
                      {app.user.full_name && <span className="text-slate-500"> ({app.user.full_name})</span>}
                    </p>
                    <p className="mt-2 rounded-lg bg-white/5 p-3 text-sm italic text-slate-200">
                      &quot;{app.reason}&quot;
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {app.created_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" })}
                    </p>
                  </div>
                </div>

                {/* Assign from available pool scholarships */}
                {poolScholarships.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {poolScholarships.map((s) => (
                      <form key={s.id} action={adminAssignScholarship}>
                        <input type="hidden" name="scholarship_id" value={s.id} />
                        <input type="hidden" name="application_id" value={app.id} />
                        <Button type="submit" size="sm">
                          Asignar {s.scholarship_code}
                        </Button>
                      </form>
                    ))}
                    <form action={adminGrantScholarshipDirect}>
                      <input type="hidden" name="id" value={app.id} />
                      <Button type="submit" size="sm">Aceptar (Basic gratis)</Button>
                    </form>
                    <form action={adminRejectApplication}>
                      <input type="hidden" name="id" value={app.id} />
                      <Button type="submit" variant="danger" size="sm">Rechazar</Button>
                    </form>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <form action={adminGrantScholarshipDirect}>
                      <input type="hidden" name="id" value={app.id} />
                      <Button type="submit" size="sm">Aceptar (Basic gratis)</Button>
                    </form>
                    <form action={adminRejectApplication}>
                      <input type="hidden" name="id" value={app.id} />
                      <Button type="submit" variant="danger" size="sm">Rechazar</Button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Pool scholarships ── */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Pool de becas disponibles</h3>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
            {poolScholarships.length}
          </span>
        </div>
        {poolScholarships.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No hay becas en el pool.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="liquid-table w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-3 py-2">Codigo</th>
                  <th className="px-3 py-2">De (Pro)</th>
                  <th className="px-3 py-2">En pool desde</th>
                </tr>
              </thead>
              <tbody>
                {poolScholarships.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 font-mono">{s.scholarship_code}</td>
                    <td className="px-3 py-2">{s.grantor.email}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {s.pool_available_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── All scholarships overview ── */}
      <Card className="p-4">
        <h3 className="font-semibold">Todas las becas ({allScholarships.length})</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="liquid-table w-full text-left text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3 py-2">Codigo</th>
                <th className="px-3 py-2">De</th>
                <th className="px-3 py-2">Para</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Creada</th>
              </tr>
            </thead>
            <tbody>
              {allScholarships.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-mono">{s.scholarship_code}</td>
                  <td className="px-3 py-2">{s.grantor.email}</td>
                  <td className="px-3 py-2">{s.recipient?.email ?? s.recipient_email ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      s.status === "active" ? "bg-emerald-500/15 text-emerald-300"
                      : s.status === "pending" ? "bg-amber-500/15 text-amber-300"
                      : s.status === "unassigned" ? "bg-blue-500/15 text-blue-300"
                      : "bg-slate-500/15 text-slate-400"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {s.granted_at.toLocaleString("es-CL", { dateStyle: "short", timeZone: "America/Santiago" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Recent reviewed applications ── */}
      {reviewedApps.length > 0 && (
        <Card className="p-4">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-slate-400 hover:text-white transition">
              Aplicaciones revisadas ({reviewedApps.length})
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="liquid-table w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Razon</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedApps.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2">{a.user.email}</td>
                      <td className="max-w-xs truncate px-3 py-2 text-slate-400">{a.reason}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          a.status === "approved" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {a.reviewed_at?.toLocaleString("es-CL", { dateStyle: "short", timeZone: "America/Santiago" }) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Card>
      )}
    </div>
  );
}
