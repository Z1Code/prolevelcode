"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { testimonials as staticTestimonials } from "@/lib/utils/site-data";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating?: number | null;
}

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

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>(
    staticTestimonials.map((t) => ({ ...t, rating: null })),
  );

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((data: Testimonial[]) => {
        if (data.length > 0) setItems(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="section-spacing liquid-section">
      <div className="container-wide">
        {/* Animated title — showcase style */}
        <motion.h2
          className="text-center text-3xl font-bold leading-tight md:text-5xl"
          variants={titleContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.span className="block" variants={titleLine}>
            Resultados que{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-400 bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmerGradient_4s_ease-in-out_infinite]">
              hablan por si solos
            </span>
          </motion.span>
        </motion.h2>

        <motion.div
          className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {items.map((item, i) => (
            <motion.div
              key={item.name + item.content.slice(0, 20) + i}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
              className="group"
            >
              {/* Glass card — navbar-inspired */}
              <div className="testimonial-glass relative h-full overflow-hidden rounded-2xl border border-white/[0.08] p-6">
                {/* Shimmer layer */}
                <div className="testimonial-shimmer pointer-events-none absolute inset-0 rounded-2xl" />
                {/* Refraction edge */}
                <div className="testimonial-refraction pointer-events-none absolute inset-0 rounded-2xl" />
                {/* Specular top highlight */}
                <div className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                <div className="relative">
                  {/* Rating */}
                  {item.rating != null && (
                    <p className="mb-3 text-sm tracking-wider">
                      {Array.from({ length: 5 }, (_, j) => (
                        <span key={j} className={j < item.rating! ? "text-amber-400" : "text-white/[0.08]"}>
                          ★
                        </span>
                      ))}
                    </p>
                  )}

                  {/* Quote */}
                  <p className="text-sm leading-relaxed text-slate-300">
                    &ldquo;{item.content}&rdquo;
                  </p>

                  {/* Author */}
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
        </motion.div>

        {/* Subtle note when few testimonials */}
        {items.length <= 2 && (
          <motion.p
            className="mt-6 text-center text-xs text-slate-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            Mas testimonios pronto — nuestros estudiantes estan terminando sus primeros cursos
          </motion.p>
        )}
      </div>
    </section>
  );
}
