"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import type { GuideStep } from "@/lib/guides/types";
import { OsTabs } from "./os-tabs";
import { CodeBlockDisplay } from "./code-block-display";
import { CopyPromptBlock } from "./copy-prompt-block";

export function GuideStepBlock({ step, index }: { step: GuideStep; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative pl-12"
    >
      {/* Step number circle */}
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-bold text-white">
        {index + 1}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">{step.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.description}</p>
        </div>

        {step.osCommands && <OsTabs commands={step.osCommands} />}
        {step.codeBlock && <CodeBlockDisplay codeBlock={step.codeBlock} />}
        {step.copyPrompt && <CopyPromptBlock label={step.copyPrompt.label} prompt={step.copyPrompt.prompt} />}

        {step.tip && (
          <div className="flex gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm leading-relaxed text-amber-200/80">{step.tip}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
