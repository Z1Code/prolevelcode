"use client";

import { guideCatalog } from "@/lib/guides/catalog";
import { PhaseSection } from "./phase-section";
import { TierDivider } from "./tier-divider";
import { TierGateOverlay } from "./tier-gate-overlay";
import type { TierLevel } from "@/lib/guides/types";

const tierRank: Record<TierLevel, number> = { free: 0, basic: 1, pro: 2 };

function canAccess(userTier: TierLevel | null, required: TierLevel): boolean {
  if (required === "free") return true;
  if (!userTier) return false;
  return tierRank[userTier] >= tierRank[required];
}

export function GuideCatalog({ userTier }: { userTier: TierLevel | null }) {
  let lastTier: TierLevel | null = null;

  return (
    <div className="space-y-12">
      {guideCatalog.map((phase) => {
        const showDivider = lastTier !== null && phase.tier !== lastTier;
        lastTier = phase.tier;
        const hasAccess = canAccess(userTier, phase.tier);

        const content = (
          <div key={phase.number}>
            {showDivider && <TierDivider tier={phase.tier} />}
            <PhaseSection phase={phase} locked={!hasAccess} />
          </div>
        );

        if (!hasAccess && phase.tier !== "free") {
          return (
            <div key={phase.number}>
              {showDivider && <TierDivider tier={phase.tier} />}
              <TierGateOverlay requiredTier={phase.tier as "basic" | "pro"}>
                <PhaseSection phase={phase} locked />
              </TierGateOverlay>
            </div>
          );
        }

        return content;
      })}
    </div>
  );
}
