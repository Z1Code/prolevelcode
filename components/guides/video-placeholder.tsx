import { Play } from "lucide-react";

export function VideoPlaceholder({ title }: { title?: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-sm">
          <Play className="ml-1 h-6 w-6 text-white/50" />
        </div>
        <p className="text-sm text-slate-500">{title ?? "Video proximamente"}</p>
      </div>
    </div>
  );
}
