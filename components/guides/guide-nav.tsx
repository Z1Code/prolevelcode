"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Guide } from "@/lib/guides/types";

export function GuideNav({ prev, next }: { prev: Guide | null; next: Guide | null }) {
  return (
    <div className="mt-16 flex items-stretch gap-3">
      {prev ? (
        <Link
          href={`/guias/${prev.slug}`}
          className="flex flex-1 items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/15 hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-slate-500" />
          <div className="min-w-0">
            <span className="text-xs text-slate-600">Anterior</span>
            <p className="truncate text-sm font-semibold text-white">{prev.title}</p>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={`/guias/${next.slug}`}
          className="flex flex-1 items-center justify-end gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-right transition hover:border-white/15 hover:bg-white/[0.06]"
        >
          <div className="min-w-0">
            <span className="text-xs text-slate-600">Siguiente</span>
            <p className="truncate text-sm font-semibold text-white">{next.title}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
