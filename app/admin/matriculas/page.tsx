import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createEnrollment, deleteEnrollment } from "../actions";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminEnrollmentsPage({ searchParams }: Props) {
  const { error } = await searchParams;

  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    orderBy: { enrolled_at: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, full_name: true } },
      course: { select: { title: true } },
    },
  });

  const errorMessages: Record<string, string> = {
    "usuario-no-encontrado": "No se encontro un usuario con ese email.",
    "ya-matriculado": "El usuario ya esta matriculado en ese curso.",
  };

  return (
    <div className="page-enter">
      <h2 className="text-2xl font-semibold">Matriculas</h2>

      {/* Enroll form */}
      <Card className="mt-4 p-4">
        <h3 className="font-semibold">Matricular usuario</h3>
        {error && (
          <p className="mt-2 alert-enter rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {errorMessages[error] ?? error}
          </p>
        )}
        <form action={createEnrollment} className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Email del usuario *</span>
            <Input name="user_email" type="email" placeholder="user@example.com" required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Curso *</span>
            <select
              name="course_id"
              className="liquid-field h-11 w-full rounded-xl px-4 text-sm text-white outline-none"
              required
            >
              <option value="">Seleccionar curso</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button type="submit" size="sm">Matricular</Button>
          </div>
        </form>
      </Card>

      {/* Enrollments list */}
      <Card className="mt-4 overflow-hidden p-0">
        <table className="liquid-table w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Accion</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3">
                  <p>{e.user.email}</p>
                  {e.user.full_name && <p className="text-xs text-slate-500">{e.user.full_name}</p>}
                </td>
                <td className="px-4 py-3">{e.course.title}</td>
                <td className="px-4 py-3">
                  <span className={e.status === "active" ? "text-emerald-300" : "text-red-300"}>
                    {e.status === "active" ? "Activa" : e.status === "refunded" ? "Reembolsada" : "Expirada"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {e.enrolled_at.toLocaleString("es-ES")}
                </td>
                <td className="px-4 py-3">
                  <form action={deleteEnrollment}>
                    <input type="hidden" name="id" value={e.id} />
                    <Button type="submit" variant="danger" size="sm">Quitar</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
