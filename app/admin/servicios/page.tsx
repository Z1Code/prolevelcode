import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { sort_order: "asc" },
    select: { id: true, title: true, price_range: true, is_active: true },
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Servicios</h2>
      <Card className="mt-4 p-4">
        <ul className="space-y-2 text-sm">
          {services.map((service) => (
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
