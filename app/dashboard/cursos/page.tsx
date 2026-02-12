import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { TierBadge } from "@/components/courses/tier-badge";

export default async function DashboardCoursesPage() {
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  // Directly enrolled courses
  const enrollments = await prisma.enrollment.findMany({
    where: { user_id: user?.id ?? "", status: "active" },
    include: { course: { select: { id: true, title: true, slug: true, subtitle: true, tier_access: true } } },
  });

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course.id));

  // Tier-accessible courses (not already enrolled)
  let tierCourses: { id: string; title: string; slug: string; subtitle: string | null; tier_access: string }[] = [];
  if (currentTier) {
    const tierFilter = currentTier === "pro" ? {} : { tier_access: "basic" };
    tierCourses = await prisma.course.findMany({
      where: { is_published: true, is_coming_soon: false, ...tierFilter },
      select: { id: true, title: true, slug: true, subtitle: true, tier_access: true },
      orderBy: { title: "asc" },
    });
    tierCourses = tierCourses.filter((c) => !enrolledCourseIds.has(c.id));
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">Mis cursos</h2>

      {enrollments.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium text-slate-400">Comprados individualmente</h3>
          {enrollments.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{item.course.title}</h3>
                <TierBadge tier={item.course.tier_access} />
              </div>
              <p className="mt-1 text-sm text-slate-400">{item.course.subtitle}</p>
              <Link href={`/dashboard/cursos/${item.course.slug}`} className="mt-3 inline-flex text-sm text-emerald-300">
                Abrir curso
              </Link>
            </Card>
          ))}
        </div>
      )}

      {tierCourses.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-slate-400">
            Disponibles con tu plan {currentTier === "pro" ? "Pro" : "Basic"}
          </h3>
          {tierCourses.map((course) => (
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
      )}

      {enrollments.length === 0 && tierCourses.length === 0 && (
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>No tienes cursos aun.</p>
          <Link href="/cursos" className="mt-2 inline-flex text-emerald-300">
            Explorar cursos →
          </Link>
        </div>
      )}
    </div>
  );
}
