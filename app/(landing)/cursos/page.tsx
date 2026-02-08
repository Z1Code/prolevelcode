import Link from "next/link";
import { getPublishedCourses } from "@/lib/utils/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currencyFormatter } from "@/lib/stripe/helpers";

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <main className="container-wide section-spacing liquid-section">
      <h1 className="text-4xl font-bold md:text-6xl">Catalogo de cursos</h1>
      <p className="mt-4 max-w-2xl text-slate-300">
        Cursos orientados a resultados con proyectos reales y acceso de por vida.
      </p>

      <div className="mt-10 space-y-4">
        {courses.map((course) => (
          <Card key={course.id} className="p-5">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="aspect-video rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/40 via-slate-950 to-violet-500/25" />
              <div>
                <h2 className="text-2xl font-semibold">{course.title}</h2>
                <p className="mt-2 text-slate-400">{course.subtitle ?? course.description}</p>
                <p className="mt-4 text-sm text-slate-300">
                  {course.total_lessons ?? 0} lecciones - {course.total_duration_minutes ?? 0} min
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="liquid-pill text-sm">{currencyFormatter(course.price_cents, course.currency)}</span>
                  <Link href={`/cursos/${course.slug}`}>
                    <Button size="sm">Ver curso</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
