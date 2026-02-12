interface TierBadgeProps {
  tier: string;
  isComingSoon?: boolean;
}

export function TierBadge({ tier, isComingSoon }: TierBadgeProps) {
  if (isComingSoon) {
    return (
      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
        Proximamente
      </span>
    );
  }

  if (tier === "pro") {
    return (
      <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
        Pro
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
      Basic
    </span>
  );
}
