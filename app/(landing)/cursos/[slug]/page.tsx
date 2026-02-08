import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/utils/data";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface CourseModule {
  id: string;
  title: string;
  lessons: Array<{ id: string; title: string }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const modules = (Array.isArray(course.modules) ? course.modules : []) as CourseModule[];

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="container-wide section-spacing liquid-section">
      <h1 className="text-4xl font-bold md:text-6xl">{course.title}</h1>
      <p className="mt-4 max-w-3xl text-slate-300">{course.long_description ?? course.subtitle ?? course.description}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <form action="/api/checkout/course" method="post">
            <input type="hidden" name="courseId" value={course.id ?? ""} />
            <Button type="submit">Comprar curso</Button>
          </form>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(`/cursos/${slug}`)}`}>
            <Button>Inicia sesion para comprar</Button>
          </Link>
        )}
        <Button variant="ghost">Ver preview</Button>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Contenido</h2>
        <div className="mt-4 space-y-4">
          {modules.map((module) => (
            <article key={module.id} className="liquid-surface p-4">
              <h3 className="font-medium">{module.title}</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                {module.lessons?.map((lesson) => (
                  <li key={lesson.id}>- {lesson.title}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
