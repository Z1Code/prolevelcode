"use client";

import { guideCatalog } from "@/lib/guides/catalog";
import { PhaseSection } from "./phase-section";
import { TierDivider } from "./tier-divider";
import type { TierLevel } from "@/lib/guides/types";

export function GuideCatalog() {
  let lastTier: TierLevel | null = null;

  return (
    <div className="space-y-12">
      {guideCatalog.map((phase) => {
        const showDivider = lastTier !== null && phase.tier !== lastTier;
        lastTier = phase.tier;

        return (
          <div key={phase.number}>
            {showDivider && <TierDivider tier={phase.tier} />}
            <PhaseSection phase={phase} />
          </div>
        );
      })}
    </div>
  );
}
