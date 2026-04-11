"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Elige tu plan",
    description: "Basic o Pro — un solo pago, acceso de por vida. Sin suscripciones ni letras pequenas.",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Pago seguro e instantaneo",
    description: "MercadoPago, PayPal o Crypto (USDT). Acceso inmediato al completar el pago.",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Aprende con video HD",
    description: "Cada leccion con token seguro, streaming protegido y progreso automatico.",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Construye proyectos reales",
    description: "Terminas cada modulo con apps funcionales listas para tu portfolio profesional.",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const titleContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
};

const titleLine = {
  hidden: { y: 40, opacity: 0, filter: "blur(8px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export function ProcessSection() {
  return (
    <section className="section-spacing liquid-section">
      <div className="container-wide">
        {/* Title — showcase animated style */}
        <motion.h2
          className="text-center text-3xl font-bold leading-tight md:text-5xl"
          variants={titleContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.span className="block" variants={titleLine}>
            Simple.{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmerGradient_4s_ease-in-out_infinite]">
              Seguro.
            </span>{" "}
            Sin fricciones.
          </motion.span>
        </motion.h2>

        <motion.div
          className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={{ hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1 } }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              {/* Glass card */}
              <div className="process-glass relative h-full overflow-hidden rounded-2xl border border-white/[0.08] p-6">
                {/* Shimmer */}
                <div className="process-shimmer pointer-events-none absolute inset-0 rounded-2xl" />
                {/* Refraction */}
                <div className="process-refraction pointer-events-none absolute inset-0 rounded-2xl" />
                {/* Top highlight */}
                <div className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-blue-500/15 text-emerald-400 transition-colors duration-300 group-hover:from-emerald-500/25 group-hover:to-blue-500/25">
                      {step.icon}
                    </div>
                    <span className="font-mono text-xs font-bold tracking-widest text-white/20">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
