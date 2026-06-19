import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-volt text-volt-ink hover:bg-volt-dim active:translate-y-px disabled:bg-line disabled:text-bone-dim",
  ghost:
    "bg-transparent text-bone border border-line hover:border-volt hover:text-volt disabled:text-bone-dim disabled:hover:border-line",
};

export function Button({ variant = "primary", className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sharp)] px-6 py-3",
        "font-mono text-sm uppercase tracking-[0.15em] transition-colors duration-150",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
