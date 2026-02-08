import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "liquid-field h-11 w-full rounded-xl px-4 text-sm text-white placeholder:text-slate-400 outline-none transition",
        props.className,
      )}
    />
  );
}


