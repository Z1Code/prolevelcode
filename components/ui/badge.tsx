import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200/25 bg-[linear-gradient(120deg,rgba(0,255,136,0.16),rgba(59,130,246,0.16))] px-3 py-1 text-xs font-medium text-emerald-100 shadow-[0_0_20px_rgba(0,255,136,0.14)]",
        className,
      )}
    />
  );
}


