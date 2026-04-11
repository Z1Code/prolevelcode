"use client";

import MuxUploader from "@mux/mux-uploader-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MuxUploadButtonProps {
  lessonId: string;
  currentStatus: string;
}

export function MuxUploadButton({ lessonId, currentStatus }: MuxUploadButtonProps) {
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startUpload() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/mux/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al iniciar upload");
      setLoading(false);
      return;
    }

    setUploadUrl(data.uploadUrl);
    setStatus("uploading");
    setLoading(false);
  }

  const statusBadge: Record<string, { label: string; className: string }> = {
    pending: { label: "Sin video", className: "bg-slate-500/20 text-slate-300" },
    uploading: { label: "Subiendo...", className: "bg-amber-500/20 text-amber-300" },
    processing: { label: "Procesando", className: "bg-blue-500/20 text-blue-300" },
    ready: { label: "Listo", className: "bg-emerald-500/20 text-emerald-300" },
    error: { label: "Error", className: "bg-red-500/20 text-red-300" },
  };

  const badge = statusBadge[status] ?? statusBadge.pending;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
        {(status === "pending" || status === "error") && !uploadUrl && (
          <Button type="button" size="sm" onClick={startUpload} disabled={loading}>
            {loading ? "Iniciando..." : "Subir video"}
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-300">{error}</p>}

      {uploadUrl && (
        <MuxUploader
          endpoint={uploadUrl}
          onSuccess={() => setStatus("processing")}
          onError={() => {
            setStatus("error");
            setError("Error al subir el video");
          }}
          className="w-full"
        />
      )}
    </div>
  );
}
