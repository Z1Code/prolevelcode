"use client";

import { useState } from "react";
import type { CurriculumResource } from "@/lib/courses/curriculum";

export function CourseResources({ resources }: { resources: CurriculumResource[] }) {
  return (
    <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-400">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          <path d="M8 11a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
        </svg>
        Recursos del curso
      </h3>
      <ul className="mt-3 space-y-2">
        {resources.map((r) => (
          <ResourceItem key={r.url} resource={r} />
        ))}
      </ul>
    </div>
  );
}

function ResourceItem({ resource }: { resource: CurriculumResource }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(resource.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <li className="rounded-lg border border-white/[0.04] bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            {resource.label}
          </a>
          {resource.hint && (
            <p className="mt-1 text-xs text-slate-500">{resource.hint}</p>
          )}
        </div>
        <button
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-slate-200"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-emerald-400">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copiado
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
              </svg>
              Copiar enlace
            </>
          ) }
        </button>
      </div>
    </li>
  );
}
