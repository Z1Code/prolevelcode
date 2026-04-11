"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="shrink-0 rounded-lg border border-slate-600/50 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
    >
      {copied ? "Copiado!" : label}
    </button>
  );
}
