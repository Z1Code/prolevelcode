import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export default async function DashboardCoursesPage() {
  const user = await getSessionUser();

  const enrollments = await prisma.enrollment.findMany({
    where: { user_id: user?.id ?? "", status: "active" },
    include: { course: { select: { title: true, slug: true, subtitle: true } } },
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Mis cursos</h2>
      <div className="mt-4 space-y-3">
        {enrollments.map((item) => (
          <Card key={item.id} className="p-4">
            <h3 className="text-lg font-semibold">{item.course.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{item.course.subtitle}</p>
            <Link href={`/dashboard/cursos/${item.course.slug}`} className="mt-3 inline-flex text-sm text-emerald-300">
              Abrir curso
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
