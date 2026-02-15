"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { testimonials as staticTestimonials } from "@/lib/utils/site-data";
import { Card } from "@/components/ui/card";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating?: number | null;
}

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
          {items.map((item) => (
            <motion.div
              key={item.name + item.content.slice(0, 20)}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            >
              <Card className="h-full p-6">
                {item.rating != null && (
                  <p className="mb-2 text-amber-400">
                    {"★".repeat(item.rating)}
                    <span className="text-slate-700">{"★".repeat(5 - item.rating)}</span>
                  </p>
                )}
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
