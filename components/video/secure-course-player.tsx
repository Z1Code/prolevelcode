"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDeviceFingerprint } from "@/lib/tokens/fingerprint";

interface LessonOption {
  id: string;
  title: string;
  courseId: string;
}

interface TokenPayload {
  token: string;
  videoUrl: string;
  expiresAt: string;
  remainingViews: number;
}

export function SecureCoursePlayer({ lessons }: { lessons: LessonOption[] }) {
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? "");
  const [tokenData, setTokenData] = useState<TokenPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fingerprintRef = useRef<string | null>(null);

  const currentLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId],
  );

  // Generate fingerprint on mount
  useEffect(() => {
    getDeviceFingerprint().then((fp) => {
      fingerprintRef.current = fp;
    });
  }, []);

  // Heartbeat management
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(
    (token: string) => {
      stopHeartbeat();

      const send = async () => {
        if (!fingerprintRef.current) return;
        try {
          const res = await fetch("/api/tokens/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tokenId: token, fingerprint: fingerprintRef.current }),
          });
          const data = await res.json();
          if (data.active === false) {
            setRevoked(true);
            setTokenData(null);
            stopHeartbeat();
          }
        } catch {
          // Silent fail on heartbeat
        }
      };

      send();
      heartbeatRef.current = setInterval(send, 30000);
    },
    [stopHeartbeat],
  );

  // Cleanup heartbeat on unmount
  useEffect(() => {
    return () => stopHeartbeat();
  }, [stopHeartbeat]);

  async function generateToken() {
    if (!currentLesson) return;

    setLoading(true);
    setError(null);
    setRevoked(false);
    stopHeartbeat();

    const response = await fetch("/api/tokens/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: currentLesson.id,
        courseId: currentLesson.courseId,
        fingerprint: fingerprintRef.current,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "No se pudo generar token");
      setLoading(false);
      return;
    }

    setTokenData(payload);
    startHeartbeat(payload.token);
    setLoading(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="liquid-surface p-4">
        <h3 className="font-semibold">Lecciones</h3>
        <ul className="mt-3 space-y-2">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <button
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selectedLessonId === lesson.id
                    ? "border-emerald-300/40 bg-emerald-300/10"
                    : "liquid-surface-soft hover:border-white/30"
                }`}
                onClick={() => {
                  setSelectedLessonId(lesson.id);
                  setTokenData(null);
                  setRevoked(false);
                  stopHeartbeat();
                }}
              >
                {lesson.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="liquid-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{currentLesson?.title ?? "Selecciona leccion"}</h3>
            <p className="text-sm text-slate-400">El video se sirve via token seguro y expira automaticamente.</p>
          </div>
          <Button onClick={generateToken} disabled={loading || !currentLesson}>
            {loading ? "Generando..." : "Generar token"}
          </Button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        {revoked ? (
          <div className="mt-4 flex aspect-video items-center justify-center rounded-xl border border-red-500/30 bg-red-500/5">
            <p className="max-w-sm text-center text-sm text-red-300">
              Se detectó una sesión activa en otro dispositivo. Solo se permite una reproducción simultánea por cuenta.
            </p>
          </div>
        ) : tokenData ? (
          <div className="mt-4">
            <iframe
              src={tokenData.videoUrl}
              className="aspect-video w-full rounded-xl border border-white/10"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            />
            <p className="mt-2 text-xs text-slate-400">
              Expira: {new Date(tokenData.expiresAt).toLocaleString("es-ES")} - Vistas restantes:{" "}
              {tokenData.remainingViews}
            </p>
          </div>
        ) : (
          <div className="liquid-surface-soft mt-4 aspect-video rounded-xl border border-dashed border-white/20" />
        )}
      </div>
    </div>
  );
}
