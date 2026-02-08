const steps = [
  { title: "Elige tu curso", description: "Explora el catalogo y selecciona el curso que encaja con tu objetivo." },
  { title: "Compra segura", description: "Pago con Stripe y acceso instantaneo al completar el checkout." },
  { title: "Aprende a tu ritmo", description: "Cada reproduccion usa token seguro con expiracion y control de vistas." },
  { title: "Construye proyectos reales", description: "Terminas cada modulo con piezas listas para portfolio." },
];

export function ProcessSection() {
  return (
    <section className="section-spacing liquid-section">
      <div className="container-wide">
        <h2 className="text-3xl font-bold md:text-5xl">Simple. Seguro. Sin fricciones.</h2>

        <div className="liquid-surface mt-10 space-y-6 border-l border-white/15 p-6 pl-8">
          {steps.map((step, index) => (
            <article key={step.title} className="relative">
              <span className="absolute -left-[33px] top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 text-[10px] font-bold text-black">{index + 1}</span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


