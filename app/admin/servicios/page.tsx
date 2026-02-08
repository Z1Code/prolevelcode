import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";

export default async function AdminServicesPage() {
  const supabase = createAdminSupabaseClient();
  const { data: services } = await supabase.from("services").select("id,title,price_range,is_active").order("sort_order", { ascending: true });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Servicios</h2>
      <Card className="mt-4 p-4">
        <ul className="space-y-2 text-sm">
          {services?.map((service) => (
            <li key={service.id} className="liquid-surface-soft flex items-center justify-between p-3">
              <span>{service.title}</span>
              <span className="text-slate-400">{service.price_range}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}


