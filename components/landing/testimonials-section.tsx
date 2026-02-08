"use client";

import { motion } from "framer-motion";
import { testimonials } from "@/lib/utils/site-data";
import { Card } from "@/components/ui/card";

export function TestimonialsSection() {
  return (
    <section className="section-spacing liquid-section">
      <div className="container-wide">
        <h2 className="text-3xl font-bold md:text-5xl">Resultados que hablan por si solos</h2>

        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {testimonials.map((item) => (
            <motion.div
              key={item.name}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            >
              <Card className="h-full p-6">
                <p className="text-sm leading-relaxed text-slate-300">&quot;{item.content}&quot;</p>
                <p className="mt-4 text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-slate-400">{item.role}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
