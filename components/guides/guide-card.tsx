"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Server, Code, GitBranch, Terminal, Sparkles, Wand2,
  Globe, Layout, User, FileText, ShoppingCart, Shield,
  Database, CreditCard, Rocket,
} from "lucide-react";
import type { Guide } from "@/lib/guides/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  code: Code,
  "git-branch": GitBranch,
  terminal: Terminal,
  sparkles: Sparkles,
  wand: Wand2,
  github: GitBranch,
  globe: Globe,
  layout: Layout,
  user: User,
  "file-text": FileText,
  "shopping-cart": ShoppingCart,
  shield: Shield,
  database: Database,
  "credit-card": CreditCard,
  rocket: Rocket,
};

export function GuideCard({ guide, index }: { guide: Guide; index: number }) {
  const Icon = iconMap[guide.icon] ?? Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
    >
      <Link
        href={`/guias/${guide.slug}`}
        className="group block rounded-xl border border-white/8 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]"
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Icon className="h-5 w-5 text-slate-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-white group-hover:text-emerald-300 transition-colors duration-200">
              {guide.title}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">{guide.description}</p>
          </div>
          <span className="shrink-0 text-xs text-slate-600">{guide.estimatedMinutes} min</span>
        </div>
      </Link>
    </motion.div>
  );
}
