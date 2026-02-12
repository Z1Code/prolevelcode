import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";

export default async function DashboardHomePage() {
  const user = await getSessionUser();

  const enrollments = await prisma.enrollment.findMany({
    where: { user_id: user?.id ?? "", status: "active" },
    orderBy: { enrolled_at: "desc" },
    include: { course: { select: { title: true, slug: true } } },
  });

  const completedLessons = await prisma.lessonProgress.count({
    where: { user_id: user?.id ?? "", is_completed: true },
  });

  const currentTier = user ? await getUserTier(user.id) : null;

  return (
    <div>
      <h2 className="text-2xl font-semibold">Resumen</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-400">Cursos activos</p>
          <p className="mt-2 text-2xl font-semibold">{enrollments.length}</p>
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

      <Card className="mt-6 p-4">
        <h3 className="font-semibold">Cursos comprados</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {enrollments.map((item) => (
            <li key={item.id}>{item.course.title}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
