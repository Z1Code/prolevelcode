import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { defaultServices } from "@/lib/utils/site-data";

export function ServicesSection() {
  return (
    <section className="section-spacing liquid-section" id="servicios">
      <div className="container-wide">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Servicios</p>
        <h2 className="mt-3 text-3xl font-bold md:text-5xl">Soluciones digitales end-to-end</h2>
        <p className="mt-3 max-w-2xl text-slate-400">Desde la idea hasta el deploy. Cada proyecto incluye diseno, desarrollo y optimizacion.</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {defaultServices.map((service) => (
            <Card
              key={service.slug}
              className="group relative p-6 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300/45 hover:shadow-[0_14px_42px_rgba(0,255,136,0.15)]"
            >
              <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: "radial-gradient(circle at 30% 20%, rgba(0,255,136,0.13), transparent 45%)" }} />
              <div className="relative z-10">
                <p className="text-2xl">{service.icon}</p>
                <h3 className="mt-4 text-xl font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{service.description}</p>
                <p className="mt-4 text-sm font-semibold text-emerald-200">{service.price}</p>
                <Link href="/servicios" className="liquid-link mt-4 inline-flex text-sm">
                  Ver mas
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/servicios"><Button>Solicitar cotizacion</Button></Link>
        </div>
      </div>
    </section>
  );
}


