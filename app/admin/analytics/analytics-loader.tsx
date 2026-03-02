"use client";

import dynamic from "next/dynamic";

const AnalyticsDashboard = dynamic(
  () => import("@/components/admin/analytics-dashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 stagger-enter">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="liquid-surface animate-pulse p-4">
              <div className="mb-2 h-3 w-16 rounded bg-white/10" />
              <div className="h-7 w-24 rounded bg-white/10" />
            </div>
          ))}
        </div>
        <div className="liquid-surface animate-pulse p-6">
          <div className="mb-4 h-4 w-40 rounded bg-white/10" />
          <div className="h-48 rounded bg-white/5" />
        </div>
      </div>
    ),
  },
);

export function AnalyticsDashboardLoader() {
  return <AnalyticsDashboard />;
}
