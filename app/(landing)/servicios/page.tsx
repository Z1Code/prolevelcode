import Link from "next/link";
import { getActiveServices } from "@/lib/utils/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function estimateAmountInCents(priceRange?: string | null) {
  if (!priceRange) return 200_000;
  const numeric = Number(priceRange.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return 200_000;
  return Math.round(numeric * 100);
}

export default async function ServicesPage() {
  const services = await getActiveServices();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="container-wide section-spacing liquid-section">
      <h1 className="text-4xl font-bold md:text-6xl">Servicios de desarrollo web e IA</h1>
      <p className="mt-4 max-w-2xl text-slate-300">Selecciona un servicio y paga en linea para bloquear tu kickoff.</p>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="p-6">
            <h2 className="text-xl font-semibold">{service.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{service.short_description}</p>
            <p className="mt-4 text-sm font-semibold text-emerald-200">{service.price_range}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {user ? (
                <form action="/api/checkout/service" method="post">
                  <input type="hidden" name="serviceId" value={service.id} />
                  <input
                    type="hidden"
                    name="quotedAmountCents"
                    value={estimateAmountInCents(service.price_range)}
                  />
                  <input type="hidden" name="noRefund" value="true" />
                  <Button type="submit" size="sm">
                    Pagar kickoff
                  </Button>
                </form>
              ) : (
                <Link href={`/login?next=${encodeURIComponent("/servicios")}`}>
                  <Button size="sm">Inicia sesion para pagar</Button>
                </Link>
              )}
              <Link href={`/contacto?service=${service.slug}`} className="liquid-link inline-flex items-center text-sm">
                Ver detalle
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Al continuar aceptas que los servicios personalizados son no-reembolsables tras confirmacion de pago.
      </p>

      <div className="mt-8">
        <Link href="/contacto">
          <Button variant="ghost">Hablar de mi proyecto</Button>
        </Link>
      </div>
    </main>
  );
}
