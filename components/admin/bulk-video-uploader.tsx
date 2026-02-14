"use client";

import { useState, useRef, useCallback } from "react";
import * as tus from "tus-js-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLessonsBulk } from "@/app/admin/actions";

interface BulkVideoUploaderProps {
  courseId: string;
}

type FileState = "queued" | "creating" | "uploading" | "complete" | "error";

interface UploadItem {
  id: string;
  file: File;
  state: FileState;
  progress: number;
  videoId: string;
  error: string;
  title: string;
  isProOnly: boolean;
  tusUpload: tus.Upload | null;
}

const MAX_CONCURRENT = 3;

export function BulkVideoUploader({ courseId }: BulkVideoUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCountRef = useRef(0);
  const queueRef = useRef<string[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      itemsRef.current = next;
      return next;
    });
  }, []);

  const startUpload = useCallback(
    async (item: UploadItem) => {
      activeCountRef.current++;
      updateItem(item.id, { state: "creating" });

      try {
        const title = item.file.name.replace(/\.[^.]+$/, "");
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

        const { videoId, tusAuth } = await res.json();
        updateItem(item.id, { videoId, state: "uploading" });

        const upload = new tus.Upload(item.file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000],
          chunkSize: 5 * 1024 * 1024,
          metadata: { filetype: item.file.type, title },
          headers: {
            AuthorizationSignature: tusAuth.signature,
            AuthorizationExpire: String(tusAuth.expiresAt),
            VideoId: tusAuth.videoId,
            LibraryId: tusAuth.libraryId,
          },
          onError(err) {
            updateItem(item.id, {
              state: "error",
              error: err.message || "Upload failed",
            });
            activeCountRef.current--;
            processQueue();
          },
          onProgress(bytesUploaded, bytesTotal) {
            updateItem(item.id, {
              progress: Math.round((bytesUploaded / bytesTotal) * 100),
            });
          },
          onSuccess() {
            updateItem(item.id, { state: "complete", progress: 100 });
            activeCountRef.current--;
            processQueue();
          },
        });

        updateItem(item.id, { tusUpload: upload });
        upload.start();
      } catch (err) {
        updateItem(item.id, {
          state: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
        activeCountRef.current--;
        processQueue();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateItem],
  );

  const processQueue = useCallback(() => {
    while (activeCountRef.current < MAX_CONCURRENT && queueRef.current.length > 0) {
      const nextId = queueRef.current.shift()!;
      const item = itemsRef.current.find((it) => it.id === nextId);
      if (item && item.state === "queued") {
        startUpload(item);
      }
    }
  }, [startUpload]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: UploadItem[] = Array.from(files)
        .filter((f) => f.type.startsWith("video/"))
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          state: "queued" as const,
          progress: 0,
          videoId: "",
          error: "",
          title: file.name.replace(/\.[^.]+$/, ""),
          isProOnly: false,
          tusUpload: null,
        }));

      if (newItems.length === 0) return;

      setItems((prev) => {
        const merged = [...prev, ...newItems];
        itemsRef.current = merged;
        return merged;
      });

      for (const it of newItems) {
        queueRef.current.push(it.id);
      }

      setTimeout(() => processQueue(), 0);
    },
    [processQueue],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles],
  );

  const retryItem = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (!item) return;
      updateItem(id, { state: "queued", progress: 0, error: "", videoId: "" });
      queueRef.current.push(id);
      processQueue();
    },
    [updateItem, processQueue],
  );

  const removeItem = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (item?.tusUpload) item.tusUpload.abort();
      queueRef.current = queueRef.current.filter((qid) => qid !== id);
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id);
        itemsRef.current = next;
        return next;
      });
    },
    [],
  );

  const allComplete = items.length > 0 && items.every((it) => it.state === "complete");
  const uploading = items.some(
    (it) => it.state === "queued" || it.state === "creating" || it.state === "uploading",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allComplete) return;
    setSubmitting(true);

    const fd = new FormData();
    fd.set("course_id", courseId);
    fd.set("count", String(items.length));
    items.forEach((it, i) => {
      fd.set(`title_${i}`, it.title);
      fd.set(`bunny_video_id_${i}`, it.videoId);
      if (it.isProOnly) fd.set(`is_pro_only_${i}`, "on");
    });

    await createLessonsBulk(fd);
    setItems([]);
    itemsRef.current = [];
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragOver
            ? "border-emerald-400 bg-emerald-400/5"
            : "border-white/10 bg-white/[0.02] hover:border-white/20"
        }`}
      >
        <svg
          className="mb-2 h-8 w-8 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm text-slate-400">
          Arrastra videos aqui o <span className="text-white underline">selecciona archivos</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Multiples archivos de video &middot; Max 3 subidas simultaneas
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Upload items */}
      {items.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="liquid-surface-soft rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    {item.state === "complete" && (
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    )}
                    {item.state === "error" && (
                      <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                    )}
                    {(item.state === "queued" ||
                      item.state === "creating" ||
                      item.state === "uploading") && (
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                    )}
                  </div>

                  {/* File name & progress */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-300">{item.file.name}</p>
                    {(item.state === "uploading" || item.state === "creating") && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {item.state === "creating" ? "Creando..." : `${item.progress}%`}
                        </span>
                      </div>
                    )}
                    {item.state === "error" && (
                      <p className="mt-0.5 text-[10px] text-red-400">{item.error}</p>
                    )}
                    {item.state === "complete" && (
                      <span className="text-[10px] font-mono text-slate-500">{item.videoId}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {item.state === "error" && (
                      <button
                        type="button"
                        onClick={() => retryItem(item.id)}
                        className="text-[10px] text-amber-400 hover:text-amber-300"
                      >
                        Reintentar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="ml-2 text-[10px] text-red-400 hover:text-red-300"
                    >
                      Quitar
                    </button>
                  </div>
                </div>

                {/* Form fields — only shown after upload is complete */}
                {item.state === "complete" && (
                  <div className="mt-2 flex items-end gap-3">
                    <label className="flex flex-1 flex-col gap-0.5">
                      <span className="text-[10px] text-slate-500">Titulo</span>
                      <Input
                        value={item.title}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        className="h-8 text-xs"
                        required
                      />
                    </label>
                    <label className="flex items-center gap-1.5 pb-1.5 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={item.isProOnly}
                        onChange={(e) => updateItem(item.id, { isProOnly: e.target.checked })}
                        className="h-3.5 w-3.5 accent-violet-400"
                      />
                      Solo Pro
                    </label>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {allComplete && (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando lecciones..." : `Crear ${items.length} leccion${items.length > 1 ? "es" : ""}`}
            </Button>
          )}

          {uploading && (
            <p className="text-xs text-slate-500">
              Subiendo {items.filter((it) => it.state === "uploading" || it.state === "creating").length} de{" "}
              {items.length} videos...
            </p>
          )}
        </form>
      )}
    </div>
  );
}
