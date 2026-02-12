import type { TierLevel } from "@/lib/guides/types";

const tierConfig: Record<TierLevel, { label: string; color: string }> = {
  free: { label: "Gratis", color: "from-emerald-500/40 via-emerald-400/20 to-emerald-500/40" },
  basic: { label: "Basic — $29", color: "from-blue-500/40 via-blue-400/20 to-blue-500/40" },
  pro: { label: "Pro — $99", color: "from-violet-500/40 via-violet-400/20 to-violet-500/40" },
};

export function TierDivider({ tier }: { tier: TierLevel }) {
  const { label, color } = tierConfig[tier];

  return (
    <div className="flex items-center gap-4 py-2">
      <div className={`h-px flex-1 bg-gradient-to-r ${color}`} />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className={`h-px flex-1 bg-gradient-to-l ${color}`} />
    </div>
  );
}
