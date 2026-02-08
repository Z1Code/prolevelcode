"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatCount(n: number): string {
  if (n < 1000) return `+${n}`;
  const k = (n / 1000).toFixed(1);
  return `+${k.endsWith(".0") ? k.slice(0, -2) : k}K`;
}

const liquidBars = [
  { id: 1, name: "steel-deep" },
  { id: 2, name: "purple-violet" },
  { id: 3, name: "lavender" },
  { id: 4, name: "cyan-teal" },
  { id: 5, name: "steel-neutral" },
  { id: 6, name: "silver-rose" },
  { id: 7, name: "amber-copper" },
  { id: 8, name: "rose-gold" },
  { id: 9, name: "dark-iridescent" },
];

export function HeroSection({ showServices = false }: { showServices?: boolean }) {
  const { t } = useTranslation();
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/users/count")
      .then((res) => res.json())
      .then((data) => setUserCount(data.count))
      .catch(() => {});
  }, []);

  return (
    <section className="liquid-hero">
      <div className="liquid-bar-grid">
        {liquidBars.map((bar, i) => (
          <div
            key={bar.id}
            className={`liquid-bar liquid-bar-${bar.name}`}
            style={{ "--bar-index": i } as React.CSSProperties}
          >
            <div className="liquid-body">
              <div className="liquid-flow" />
              <div className="liquid-glass" />
              <div className="liquid-reflection" />
            </div>
            <div className="liquid-wave liquid-wave-lr" />
            <div className="liquid-wave liquid-wave-rl" />
          </div>
        ))}
      </div>

      <div className="liquid-hero-content">
        <div className="container-wide">
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <Badge className="hero-glass-badge">{t.hero.badge1}</Badge>
            <Badge className="hero-glass-badge">{t.hero.badge2}</Badge>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
          >
            <h1 className="max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl lg:text-[5.5rem]">
              {t.hero.heading} <span className="liquid-gradient-text">{t.hero.headingHighlight}</span>
            </h1>
            <p className="hero-glass-panel hero-glass-panel-sm mb-1 max-w-[20ch] text-sm leading-snug text-slate-300 md:mb-2 md:text-base">
              {t.hero.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-wrap items-center gap-6 lg:gap-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24, ease: "easeOut" }}
          >
            <div className="flex gap-3">
              {showServices ? (
                <Link href="/servicios">
                  <Button size="sm" className="hero-glass-cta">
                    {t.hero.cta1}
                  </Button>
                </Link>
              ) : null}

              <Link href="/cursos">
                <Button variant="ghost" size="sm" className="hero-glass-cta-outline">
                  {t.hero.cta2}
                </Button>
              </Link>
            </div>

            {userCount !== null && userCount >= 100 && (
              <div className="hidden items-center gap-3 sm:flex">
                <div className="hero-avatar-stack">
                  <div className="hero-avatar" style={{ background: "linear-gradient(135deg, #00ff88, #3366ff)" }} />
                  <div className="hero-avatar" style={{ background: "linear-gradient(135deg, #8855ff, #ff6699)" }} />
                  <div className="hero-avatar" style={{ background: "linear-gradient(135deg, #3366ff, #00ddff)" }} />
                </div>
                <p className="text-xs leading-tight text-slate-400">
                  <span className="font-semibold text-white">{formatCount(userCount)}</span> {t.hero.students}
                  <br />
                  {t.hero.satisfied}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="liquid-hero-noise" />
    </section>
  );
}
