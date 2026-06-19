import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names, resolving Tailwind conflicts last-wins.
 * Use this instead of inline style objects (see CLAUDE.md conventions).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
