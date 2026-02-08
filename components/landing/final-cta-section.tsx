import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section className="section-spacing liquid-section">
      <div className="container-wide liquid-surface px-6 py-14 text-center md:px-10">
        <h2 className="text-3xl font-bold md:text-5xl">Listo para empezar?</h2>
        <p className="mt-3 text-sm text-slate-300">Construyamos tu proximo producto o lleva tus skills al siguiente nivel.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/servicios"><Button size="lg">Contratame</Button></Link>
          <Link href="/cursos"><Button size="lg" variant="ghost">Ver cursos</Button></Link>
        </div>
        <p className="mt-6 text-xs text-slate-300">o escribeme a hola@tumarca.com</p>
      </div>
    </section>
  );
}


