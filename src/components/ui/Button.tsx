import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  // Volt sticker block: black border, hard bone offset shadow, presses on click.
  primary:
    "bg-volt text-volt-ink border-2 border-volt-ink shadow-[4px_4px_0_0_var(--color-bone)] hover:bg-volt-dim disabled:bg-line disabled:text-bone-dim disabled:border-line disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0",
  // Outlined block: line border that snaps to volt + a volt shadow on hover.
  ghost:
    "bg-ink text-bone border-2 border-line shadow-[4px_4px_0_0_transparent] hover:border-volt hover:text-volt hover:shadow-[4px_4px_0_0_var(--color-volt)] disabled:text-bone-dim disabled:hover:border-line disabled:hover:text-bone-dim disabled:hover:shadow-none",
};

export function Button({ variant = "primary", className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "press inline-flex items-center justify-center gap-2 rounded-[var(--radius-sharp)] px-6 py-3",
        "font-mono text-sm font-semibold uppercase tracking-[0.18em]",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
