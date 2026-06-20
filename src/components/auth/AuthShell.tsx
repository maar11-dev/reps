import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

/** Shared input styling for the auth forms (mirrors the builder's text inputs). */
export const authInputClass =
  "w-full rounded-[var(--radius-sharp)] border border-line bg-surface px-4 py-3 font-sans text-sm text-bone placeholder:text-bone-dim/60 focus-visible:border-volt";

/** Centered page chrome for the auth screens. Server-compatible (no client code). */
export function AuthShell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-8 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-3">
          <p className="kicker text-volt">{kicker}</p>
          <h1 className="display text-4xl text-bone sm:text-5xl">{title}</h1>
          {subtitle ? <p className="text-bone-dim">{subtitle}</p> : null}
        </div>
        {children}
      </main>
    </>
  );
}
