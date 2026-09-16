"use client";
import { cx } from "@/lib/format";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "md" | "lg" };

export function Button({ variant = "primary", size = "md", className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-[transform,background-color,opacity] duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 select-none",
        size === "lg" ? "h-14 px-6 text-base" : "h-12 px-5 text-sm",
        variant === "primary" && "brand-gradient text-white shadow-[0_8px_30px_-10px_rgba(124,108,255,0.7)] hover:brightness-110",
        variant === "secondary" && "bg-surface-3 text-text hover:bg-[#2b3145]",
        variant === "ghost" && "bg-transparent text-muted hover:text-text hover:bg-white/5",
        variant === "danger" && "bg-danger/15 text-danger hover:bg-danger/25",
        className,
      )}
    />
  );
}
