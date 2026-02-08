"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface VideoPreviewModalProps {
  youtubeId: string;
  title: string;
}

export function VideoPreviewModal({ youtubeId, title }: VideoPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleOpen() {
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function handleClose() {
    setOpen(false);
    dialogRef.current?.close();
  }

  return (
    <>
      <Button variant="ghost" onClick={handleOpen}>
        Ver preview
      </Button>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0a0f1a] p-0 backdrop:bg-black/80"
        onClose={() => setOpen(false)}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={handleClose}
              className="rounded-lg px-3 py-1 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              Cerrar
            </button>
          </div>
          <div className="mt-3">
            {open && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                className="aspect-video w-full rounded-xl"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
