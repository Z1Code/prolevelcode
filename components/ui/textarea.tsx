import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "liquid-field min-h-32 w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition",
        props.className,
      )}
    />
  );
}


