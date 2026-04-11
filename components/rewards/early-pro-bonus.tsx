"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface EarlyProBonusProps {
  proOrderNumber: number; // 1–6
}

export function EarlyProBonus({ proOrderNumber }: EarlyProBonusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-amber-500/10 p-6"
    >
      {/* Shimmer effect */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(167,139,250,0.12) 45%, rgba(167,139,250,0.25) 50%, rgba(167,139,250,0.12) 55%, transparent 60%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
      />

      {/* Confetti burst */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: "30%",
              backgroundColor: ["#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#60a5fa"][i % 5],
            }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: 0,
              scale: 0,
              x: (Math.random() - 0.5) * 250,
              y: (Math.random() - 0.5) * 250,
            }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 + i * 0.05 }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header with animated gift icon */}
        <div className="flex items-center gap-3">
          <motion.span
            className="text-3xl"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            🎁
          </motion.span>
          <div>
            <motion.p
              className="text-xs font-semibold uppercase tracking-wider text-violet-300"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              Bonus exclusivo
            </motion.p>
            <motion.h3
              className="text-lg font-bold text-white"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              Eres el #{proOrderNumber} en obtener el plan Pro
            </motion.h3>
          </div>
        </div>

        <motion.p
          className="mt-3 text-sm text-slate-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Por ser de los primeros 6 usuarios Pro, tu beca para un amigo es{" "}
          <span className="font-semibold text-emerald-300">permanente (de por vida)</span> en lugar
          de 30 dias. Regala acceso Basic para siempre a quien quieras.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-4"
        >
          <Link
            href="/dashboard/beca"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-500"
          >
            Otorgar beca permanente
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
