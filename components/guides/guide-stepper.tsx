"use client";

import type { GuideStep } from "@/lib/guides/types";
import { GuideStepBlock } from "./guide-step-block";

export function GuideStepper({ steps }: { steps: GuideStep[] }) {
  return (
    <div className="relative space-y-10">
      {/* Vertical progress line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gradient-to-b from-white/15 via-white/8 to-transparent" />

      {steps.map((step, i) => (
        <GuideStepBlock key={i} step={step} index={i} />
      ))}
    </div>
  );
}
