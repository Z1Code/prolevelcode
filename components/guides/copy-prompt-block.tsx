"use client";

import { useState } from "react";
import { Check, Copy, Wand2 } from "lucide-react";

export function CopyPromptBlock({ label, prompt }: { label: string; prompt: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="guide-prompt-surface">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-500/15 px-4 py-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">{label}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 hover:text-emerald-200"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copiar prompt
            </>
          )}
        </button>
      </div>
      <div className="p-4">
        <pre className="whitespace-pre-wrap break-words font-mono text-[13.5px] leading-relaxed text-slate-200">
          {prompt}
        </pre>
      </div>
    </div>
  );
}
