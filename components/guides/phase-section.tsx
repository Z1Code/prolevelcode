"use client";

import { motion } from "framer-motion";
import type { GuidePhase } from "@/lib/guides/types";
import { GuideCard } from "./guide-card";

export function PhaseSection({ phase, locked = false }: { phase: GuidePhase; locked?: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8 text-xs font-bold text-slate-300">
          {phase.number}
        </span>
        <div>
          <h2 className="text-lg font-bold text-white">
            Fase {phase.number}: {phase.title}
          </h2>
          <p className="text-sm text-slate-500">{phase.description}</p>
        </div>
      </div>

      <div className="grid gap-2">
        {phase.guides.map((guide, i) => (
          <GuideCard key={guide.slug} guide={guide} index={i} locked={locked} />
        ))}
      </div>
    </motion.section>
  );
}
