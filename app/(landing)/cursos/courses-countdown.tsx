"use client";

import { useEffect, useState } from "react";

// Saturday Feb 14 2026, 5:00 PM Chile Summer Time (UTC-3)
const TARGET = new Date("2026-02-14T20:00:00Z").getTime();

function getTimeLeft() {
  const diff = TARGET - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function CoursesCountdown({ children }: { children: React.ReactNode }) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(
    getTimeLeft
  );

  useEffect(() => {
    const id = setInterval(() => {
      const t = getTimeLeft();
      setTimeLeft(t);
      if (!t) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) return <>{children}</>;

  const blocks = [
    { value: timeLeft.days, label: "Dias" },
    { value: timeLeft.hours, label: "Horas" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Seg" },
  ];

  return (
    <div className="flex flex-col items-center py-24 text-center">
      <h2 className="text-2xl font-semibold">Cursos disponibles pronto</h2>
      <p className="mt-2 text-sm text-slate-400">
        El catalogo se desbloquea en:
      </p>

      <div className="mt-8 flex gap-3">
        {blocks.map((b) => (
          <div
            key={b.label}
            className="flex min-w-[72px] flex-col items-center rounded-xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur"
          >
            <span className="text-3xl font-bold tabular-nums">
              {String(b.value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-xs uppercase tracking-wider text-slate-400">
              {b.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Sabado 14 de febrero — 5:00 PM (hora Chile)
      </p>
    </div>
  );
}
