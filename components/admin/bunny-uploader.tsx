"use client";

import { useState, useRef } from "react";
import * as tus from "tus-js-client";
import { Button } from "@/components/ui/button";

interface BunnyUploaderProps {
  /** Called when upload completes with the Bunny video GUID */
  onUploadComplete: (videoId: string) => void;
  /** Lesson title used as the video name on Bunny */
  videoTitle?: string;
}

type UploadState = "idle" | "creating" | "uploading" | "complete" | "error";

export function BunnyUploader({ onUploadComplete, videoTitle }: BunnyUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [videoId, setVideoId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<tus.Upload | null>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setState("creating");
    setError("");
    setProgress(0);

    try {
      // 1. Create video entry on Bunny via our API
      const title = videoTitle || file.name.replace(/\.[^.]+$/, "");
      const res = await fetch("/api/admin/bunny/create-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create upload");
      }

      const { videoId: vid, tusAuth } = await res.json();
      setVideoId(vid);
      setState("uploading");

      // 2. Upload directly to Bunny via TUS protocol
      const upload = new tus.Upload(file, {
        endpoint: "https://video.bunnycdn.com/tusupload",
        retryDelays: [0, 3000, 5000, 10000],
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        metadata: {
          filetype: file.type,
          title,
        },
        headers: {
          AuthorizationSignature: tusAuth.signature,
          AuthorizationExpire: String(tusAuth.expiresAt),
          VideoId: tusAuth.videoId,
          LibraryId: tusAuth.libraryId,
        },
        onError(err) {
          console.error("[BunnyUploader] TUS error:", err);
          setState("error");
          setError(err.message || "Upload failed");
        },
        onProgress(bytesUploaded, bytesTotal) {
          const pct = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(pct);
        },
        onSuccess() {
          setState("complete");
          setProgress(100);
          onUploadComplete(vid);
        },
      });

      uploadRef.current = upload;
      upload.start();
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function handleCancel() {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    setState("idle");
    setProgress(0);
    setError("");
  }

  return (
    <div className="space-y-2">
      {state === "idle" && (
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="block w-full text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-white/15"
          />
          <Button type="button" size="sm" onClick={handleUpload}>
            Subir
          </Button>
        </div>
      )}

      {state === "creating" && (
        <p className="text-xs text-amber-300">Creando video en Bunny...</p>
      )}

      {state === "uploading" && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Subiendo a Bunny Stream...</span>
            <span className="text-white font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="text-[10px] text-red-400 hover:text-red-300"
          >
            Cancelar
          </button>
        </div>
      )}

      {state === "complete" && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-300">Video subido</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
            {videoId}
          </span>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-1">
          <p className="text-xs text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="text-[10px] text-slate-400 hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
