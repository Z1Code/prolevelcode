import { Card } from "@/components/ui/card";
import { currencyFormatter } from "@/lib/stripe/helpers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface PaymentEnrollment {
  id: string;
  amount_paid_cents: number | null;
  currency: string | null;
  status: string;
  enrolled_at: string;
  users: Array<{ email: string | null }>;
  courses: Array<{ title: string | null }>;
}

export default async function AdminPaymentsPage() {
  const supabase = createAdminSupabaseClient();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,amount_paid_cents,currency,status,enrolled_at,users(email),courses(title)")
    .order("enrolled_at", { ascending: false })
    .limit(100);

  const rows = ((enrollments ?? []) as unknown) as PaymentEnrollment[];

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
            {rows.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3">{payment.users?.[0]?.email}</td>
                <td className="px-4 py-3">{payment.courses?.[0]?.title}</td>
                <td className="px-4 py-3">{currencyFormatter(payment.amount_paid_cents ?? 0, payment.currency ?? "USD")}</td>
                <td className="px-4 py-3">{payment.status}</td>
                <td className="px-4 py-3">{new Date(payment.enrolled_at).toLocaleString("es-ES")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
