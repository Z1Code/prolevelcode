import { prisma } from "@/lib/prisma";
import { publishAsTestimonial, deleteReview } from "../actions";

export default async function AdminResenasPage() {
  const courseReviews = await prisma.courseReview.findMany({
    orderBy: { created_at: "desc" },
    include: {
      user: { select: { full_name: true, email: true } },
      course: { select: { title: true } },
    },
  });

  const lessonReviews = await prisma.lessonReview.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
    include: {
      user: { select: { full_name: true, email: true } },
      lesson: { select: { title: true } },
      course: { select: { title: true } },
    },
  });

  const totalReviews = courseReviews.length + lessonReviews.length;
  const avgCourseRating = courseReviews.length > 0
    ? (courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length).toFixed(1)
    : "—";

  return (
    <div>
      <h2 className="text-xl font-semibold">Resenas</h2>

      {/* Summary cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="liquid-surface p-4">
          <p className="text-2xl font-bold">{totalReviews}</p>
          <p className="text-xs text-slate-500">Total resenas</p>
        </div>
        <div className="liquid-surface p-4">
          <p className="text-2xl font-bold">{courseReviews.length}</p>
          <p className="text-xs text-slate-500">Resenas de cursos</p>
        </div>
        <div className="liquid-surface p-4">
          <p className="text-2xl font-bold">{avgCourseRating}</p>
          <p className="text-xs text-slate-500">Promedio cursos</p>
        </div>
      </div>

      {/* Course reviews table */}
      <h3 className="mt-8 text-sm font-semibold uppercase tracking-widest text-slate-400">Resenas de cursos</h3>
      {courseReviews.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Sin resenas de cursos aun.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-500">
                <th className="pb-2 pr-4">Usuario</th>
                <th className="pb-2 pr-4">Curso</th>
                <th className="pb-2 pr-4">Rating</th>
                <th className="pb-2 pr-4">Comentario</th>
                <th className="pb-2 pr-4">Fecha</th>
                <th className="pb-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courseReviews.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="py-2 pr-4">
                    <p className="text-sm">{r.user.full_name || "—"}</p>
                    <p className="text-[10px] text-slate-500">{r.user.email}</p>
                  </td>
                  <td className="py-2 pr-4 text-sm">{r.course.title}</td>
                  <td className="py-2 pr-4">
                    <span className="text-amber-400">{"★".repeat(r.rating)}</span>
                    <span className="text-slate-700">{"★".repeat(5 - r.rating)}</span>
                  </td>
                  <td className="max-w-xs truncate py-2 pr-4 text-xs text-slate-400">{r.comment}</td>
                  <td className="py-2 pr-4 text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString("es")}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <form action={publishAsTestimonial}>
                        <input type="hidden" name="review_id" value={r.id} />
                        <button className="rounded border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300 transition hover:bg-emerald-500/20">
                          Publicar
                        </button>
                      </form>
                      <form action={deleteReview}>
                        <input type="hidden" name="review_id" value={r.id} />
                        <input type="hidden" name="type" value="course" />
                        <button className="rounded border border-red-400/20 bg-red-500/10 px-2 py-1 text-[10px] text-red-300 transition hover:bg-red-500/20">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lesson reviews */}
      <details className="mt-8">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-widest text-slate-400">
          Resenas de lecciones ({lessonReviews.length})
        </summary>
        {lessonReviews.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Sin resenas de lecciones aun.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-500">
                  <th className="pb-2 pr-4">Usuario</th>
                  <th className="pb-2 pr-4">Leccion</th>
                  <th className="pb-2 pr-4">Curso</th>
                  <th className="pb-2 pr-4">Rating</th>
                  <th className="pb-2 pr-4">Comentario</th>
                  <th className="pb-2 pr-4">Fecha</th>
                  <th className="pb-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lessonReviews.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-2 pr-4">
                      <p className="text-sm">{r.user.full_name || "—"}</p>
                      <p className="text-[10px] text-slate-500">{r.user.email}</p>
                    </td>
                    <td className="py-2 pr-4 text-sm">{r.lesson.title}</td>
                    <td className="py-2 pr-4 text-xs text-slate-500">{r.course.title}</td>
                    <td className="py-2 pr-4">
                      <span className="text-amber-400">{"★".repeat(r.rating)}</span>
                      <span className="text-slate-700">{"★".repeat(5 - r.rating)}</span>
                    </td>
                    <td className="max-w-xs truncate py-2 pr-4 text-xs text-slate-400">{r.comment || "—"}</td>
                    <td className="py-2 pr-4 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString("es")}
                    </td>
                    <td className="py-2">
                      <form action={deleteReview}>
                        <input type="hidden" name="review_id" value={r.id} />
                        <input type="hidden" name="type" value="lesson" />
                        <button className="rounded border border-red-400/20 bg-red-500/10 px-2 py-1 text-[10px] text-red-300 transition hover:bg-red-500/20">
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </div>
  );
}
