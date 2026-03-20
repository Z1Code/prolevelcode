"use client";

import { motion } from "framer-motion";

interface Testimonial {
  name: string;
  role: string;
  content: string;
}

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  return (
    <section className="section-spacing liquid-section">
      <div className="container-wide">
        <h2 className="text-center text-3xl font-bold leading-tight md:text-5xl">
          Resultados que{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-400 bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmerGradient_4s_ease-in-out_infinite]">
            hablan por si solos
          </span>
        </h2>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={`${item.name}-${item.role}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group"
            >
              <div className="testimonial-glass relative h-full overflow-hidden rounded-2xl border border-white/[0.08] p-6">
                <div className="testimonial-shimmer pointer-events-none absolute inset-0 rounded-2xl" />
                <div className="testimonial-refraction pointer-events-none absolute inset-0 rounded-2xl" />
                <div className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                <div className="relative">
                  <p className="mb-3 text-sm tracking-wider">
                    <span className="text-amber-400">★★★★★</span>
                  </p>

                  <p className="text-sm leading-relaxed text-slate-300">
                    &ldquo;{item.content}&rdquo;
                  </p>

                  <div className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 text-xs font-bold text-emerald-300">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
