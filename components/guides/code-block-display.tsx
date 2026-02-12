"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeBlock } from "@/lib/guides/types";

export function CodeBlockDisplay({ codeBlock }: { codeBlock: CodeBlock }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeBlock.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="guide-code-surface">
      {codeBlock.filename && (
        <div className="guide-code-header flex items-center justify-between">
          <span>{codeBlock.filename}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copiar
              </>
            )}
          </button>
        </div>
      )}
      <div className="guide-code-body">
        <pre className="whitespace-pre-wrap break-words">
          <code>{codeBlock.code}</code>
        </pre>
      </div>
      {!codeBlock.filename && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-600/40 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
}
