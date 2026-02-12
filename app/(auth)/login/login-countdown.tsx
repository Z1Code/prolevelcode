"use client";

import { useEffect, useState } from "react";

// Saturday Feb 14 2026, 5:00 PM Chile Summer Time (UTC-3)
const TARGET = new Date("2026-02-14T20:00:00Z").getTime();

const TIMEZONES = [
  { zone: "America/Mexico_City", label: "Mexico" },
  { zone: "America/Bogota", label: "Colombia" },
  { zone: "America/Lima", label: "Peru" },
  { zone: "America/Santiago", label: "Chile" },
  { zone: "America/Argentina/Buenos_Aires", label: "Argentina" },
  { zone: "America/Sao_Paulo", label: "Brasil" },
  { zone: "America/Los_Angeles", label: "California" },
  { zone: "America/New_York", label: "Miami" },
  { zone: "Europe/Madrid", label: "Espana" },
];

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

// Format the TARGET date in each timezone to show local launch time
function launchTime(zone: string) {
  return new Date(TARGET).toLocaleTimeString("es-CL", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function LoginCountdown({ children }: { children: React.ReactNode }) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(
    getTimeLeft
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="flex flex-col items-center text-center">
      <h1 className="text-2xl font-semibold">Muy pronto</h1>
      <p className="mt-2 text-sm text-slate-400">
        La plataforma abrira sus puertas en:
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

      {mounted && (
        <div className="mt-8 w-full">
          <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
            Hora de lanzamiento en tu pais
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TIMEZONES.map((tz) => (
              <div
                key={tz.zone}
                className="flex flex-col items-center rounded-lg border border-white/5 bg-white/[0.03] px-2 py-2.5"
              >
                <span className="text-[11px] text-slate-500">{tz.label}</span>
                <span className="text-sm font-semibold tabular-nums text-slate-200">
                  {launchTime(tz.zone)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
