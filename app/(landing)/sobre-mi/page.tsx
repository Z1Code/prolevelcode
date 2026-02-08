export default function AboutPage() {
  return (
    <main className="container-wide section-spacing liquid-section">
      <h1 className="text-4xl font-bold md:text-6xl">Sobre mi</h1>
      <p className="mt-4 max-w-3xl text-slate-300">
        Soy desarrollador full-stack especializado en productos digitales de alto impacto. Trabajo entre estrategia,
        diseno y ejecucion tecnica para construir software que genera negocio.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="liquid-surface p-5">
          <h2 className="text-xl font-semibold">Experiencia</h2>
          <p className="mt-2 text-sm text-slate-400">
            5+ anos desarrollando plataformas SaaS, e-commerce y sistemas internos para startups y empresas.
          </p>
        </article>
        <article className="liquid-surface p-5">
          <h2 className="text-xl font-semibold">Especialidades</h2>
          <p className="mt-2 text-sm text-slate-400">
            Next.js, TypeScript, PostgreSQL, MercadoPago, UX premium, integraciones de IA y performance web.
          </p>
        </article>
      </div>
    </main>
  );
}
