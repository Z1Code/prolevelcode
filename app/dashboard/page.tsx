import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";

export default async function DashboardHomePage() {
  const user = await getSessionUser();
  const currentTier = user ? await getUserTier(user.id) : null;

  // Count courses available based on active tier
  let courseCount = 0;
  if (currentTier) {
    const tierFilter = currentTier === "pro" ? {} : { tier_access: "basic" };
    courseCount = await prisma.course.count({
      where: { is_published: true, is_coming_soon: false, ...tierFilter },
    });
  }

  const completedLessons = user
    ? await prisma.lessonProgress.count({
        where: { user_id: user.id, is_completed: true },
      })
    : 0;

  return (
    <div>
      <h2 className="text-2xl font-semibold">Resumen</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-400">Cursos disponibles</p>
          <p className="mt-2 text-2xl font-semibold">{courseCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Lecciones completadas</p>
          <p className="mt-2 text-2xl font-semibold">{completedLessons}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Plan</p>
          <p className={`mt-2 text-2xl font-semibold ${
            currentTier === "pro" ? "text-violet-300" : currentTier === "basic" ? "text-emerald-300" : "text-slate-500"
          }`}>
            {currentTier === "pro" ? "Pro" : currentTier === "basic" ? "Basic" : "Sin plan"}
          </p>
          {!currentTier && (
            <Link href="/planes" className="mt-1 text-xs text-slate-400 hover:text-white">
              Ver planes →
            </Link>
          )}
        </Card>
      </div>

      {!currentTier && (
        <Card className="mt-6 p-4">
          <p className="text-sm text-slate-400">Necesitas un plan activo para acceder a los cursos.</p>
          <Link href="/planes" className="mt-2 inline-flex text-sm text-emerald-300">
            Ver planes →
          </Link>
        </Card>
      )}

      {currentTier && (
        <Card className="mt-6 p-4">
          <h3 className="font-semibold">Tus cursos</h3>
          <p className="mt-1 text-sm text-slate-400">
            Tienes acceso a {currentTier === "pro" ? "todos los cursos" : "los cursos Basic"}.
          </p>
          <Link href="/dashboard/cursos" className="mt-2 inline-flex text-sm text-emerald-300">
            Ver mis cursos →
          </Link>
        </Card>
      )}
    </div>
  );
}
