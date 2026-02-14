import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { TierBadge } from "@/components/courses/tier-badge";

export default async function DashboardCoursesPage() {
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  let courses: { id: string; title: string; slug: string; subtitle: string | null; tier_access: string }[] = [];
  if (currentTier) {
    const tierFilter = currentTier === "pro" ? {} : { tier_access: "basic" };
    courses = await prisma.course.findMany({
      where: { is_published: true, is_coming_soon: false, ...tierFilter },
      select: { id: true, title: true, slug: true, subtitle: true, tier_access: true },
      orderBy: { title: "asc" },
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">Mis cursos</h2>
      {currentTier && (
        <p className="mt-1 text-sm text-slate-400">
          Plan activo: <span className={currentTier === "pro" ? "text-violet-300" : "text-emerald-300"}>{currentTier === "pro" ? "Pro" : "Basic"}</span>
        </p>
      )}

      {courses.length > 0 ? (
        <div className="mt-4 space-y-3">
          {courses.map((course) => (
            <Card key={course.id} className="p-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <TierBadge tier={course.tier_access} />
              </div>
              <p className="mt-1 text-sm text-slate-400">{course.subtitle}</p>
              <Link href={`/dashboard/cursos/${course.slug}`} className="mt-3 inline-flex text-sm text-emerald-300">
                Abrir curso
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>{currentTier ? "No hay cursos disponibles aun." : "Necesitas un plan para acceder a los cursos."}</p>
          <Link href="/planes" className="mt-2 inline-flex text-emerald-300">
            Ver planes →
          </Link>
        </div>
      )}
    </div>
  );
}
