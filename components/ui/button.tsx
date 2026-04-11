import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold tracking-[0.01em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030811] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "btn-press border border-emerald-100/30 bg-[linear-gradient(120deg,#00ff88,#2dd4bf_45%,#3b82f6)] text-[#04180f]",
        ghost:
          "btn-press-subtle border border-slate-200/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] text-slate-100 backdrop-blur-xl hover:border-slate-100/45 hover:bg-white/[0.12]",
        danger:
          "btn-press-subtle border border-red-300/35 bg-[linear-gradient(130deg,rgba(239,68,68,0.24),rgba(127,29,29,0.32))] text-red-100 hover:border-red-200/40 hover:bg-[linear-gradient(130deg,rgba(239,68,68,0.28),rgba(153,27,27,0.36))]",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
