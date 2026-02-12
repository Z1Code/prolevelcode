"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { TierLevel } from "@/lib/guides/types";

const tierThemes: Record<Exclude<TierLevel, "free">, { label: string; price: string; color: string; border: string; bg: string; btnBg: string }> = {
  basic: {
    label: "Basic",
    price: "$29",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    btnBg: "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300",
  },
  pro: {
    label: "Pro",
    price: "$99",
    color: "text-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/10",
    btnBg: "bg-violet-500/15 hover:bg-violet-500/25 border-violet-500/30 text-violet-300",
  },
};

export function TierGateOverlay({
  requiredTier,
  children,
}: {
  requiredTier: Exclude<TierLevel, "free">;
  children: React.ReactNode;
}) {
  const theme = tierThemes[requiredTier];

  return (
    <div className="relative">
      {/* Blurred content behind */}
      <div className="pointer-events-none select-none blur-[6px] opacity-40">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${theme.border} ${theme.bg}`}>
            <Lock className={`h-5 w-5 ${theme.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Plan {theme.label} requerido
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Desde {theme.price} USD — acceso de por vida
            </p>
          </div>
          <Link
            href="/planes"
            className={`mt-1 inline-flex h-9 items-center rounded-full border px-5 text-sm font-semibold transition ${theme.btnBg}`}
          >
            Ver planes
          </Link>
        </div>
      </div>
    </div>
  );
}
