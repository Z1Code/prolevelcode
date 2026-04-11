"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SyncDurationsButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<string>("");

  async function handleSync() {
    setState("loading");
    try {
      const res = await fetch("/api/admin/bunny/sync-durations", { method: "POST" });
      const data = await res.json();
      if (data.updated > 0 || data.failed > 0) {
        setResult(`${data.updated} actualizadas, ${data.failed} fallidas de ${data.total}`);
      } else {
        setResult(data.message || "Nada que actualizar");
      }
      setState("done");
    } catch {
      setResult("Error de conexión");
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSync}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Sincronizando..." : "Sync duraciones desde Bunny"}
      </Button>
      {result && (
        <span className={`text-xs ${state === "error" ? "text-red-400" : "text-emerald-400/70"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
