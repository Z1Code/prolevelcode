import Link from "next/link";
import { featuredCourses } from "@/lib/utils/site-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CoursesSection() {
  return (
    <section className="section-spacing liquid-section" id="cursos">
      <div className="container-wide">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Cursos</p>
        <h2 className="mt-3 text-3xl font-bold md:text-5xl">Aprende a construir el futuro</h2>
        <p className="mt-3 max-w-2xl text-slate-400">Cursos practicos, sin relleno. Del concepto al deploy en cada modulo.</p>

          <div className="mt-10 space-y-4">
            {featuredCourses.map((course) => (
              <Card key={course.slug} className="p-5">
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <div className="aspect-video rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/40 via-slate-950 to-emerald-400/25" />
                  <div>
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{course.subtitle}</p>
                    <p className="mt-3 text-sm text-slate-400">{course.modules} modulos - {course.lessons} lecciones - {course.duration}</p>
                    <div className="mt-4">
                      <Link href={`/cursos/${course.slug}`} className="liquid-link text-sm font-medium">
                        Ver curso
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cursos">
              <Button>Ver todos los cursos</Button>
            </Link>
            <Link href="/planes">
              <Button variant="ghost">Ver planes</Button>
            </Link>
            <Card className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs text-slate-300">
              <span>Videos protegidos con token auto-destruible</span>
              <span>Acceso de por vida</span>
              <span>Codigo fuente incluido</span>
            </Card>
          </div>
      </div>
    </section>
  );
}
