import { Card } from "@/components/ui/card";
import { currencyFormatter } from "@/lib/payments/helpers";
import { prisma } from "@/lib/prisma";

export default async function AdminPaymentsPage() {
  const enrollments = await prisma.enrollment.findMany({
    orderBy: { enrolled_at: "desc" },
    take: 100,
    select: {
      id: true,
      amount_paid_cents: true,
      currency: true,
      status: true,
      enrolled_at: true,
      user: { select: { email: true } },
      course: { select: { title: true } },
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Pagos</h2>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="liquid-table w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3">{payment.user.email}</td>
                <td className="px-4 py-3">{payment.course.title}</td>
                <td className="px-4 py-3">{currencyFormatter(payment.amount_paid_cents ?? 0, payment.currency)}</td>
                <td className="px-4 py-3">{payment.status}</td>
                <td className="px-4 py-3">{payment.enrolled_at.toLocaleString("es-ES")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
