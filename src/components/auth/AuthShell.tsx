import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

/** Shared input styling for the auth forms (mirrors the builder's text inputs). */
export const authInputClass =
  "w-full rounded-[var(--radius-sharp)] border-2 border-line bg-surface px-4 py-3 font-sans text-sm text-bone placeholder:text-bone-dim/60 focus-visible:border-volt";

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
      <main className="mx-auto flex max-w-md flex-col gap-7 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-3">
          <span className="kicker rise w-fit border-2 border-volt bg-volt/10 px-3 py-1.5 text-volt [animation-delay:40ms]">
            {kicker}
          </span>
          <h1 className="display rise text-5xl text-bone [animation-delay:120ms] sm:text-6xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="rise text-bone-dim [animation-delay:200ms]">{subtitle}</p>
          ) : null}
        </div>
        <div className="rise border-2 border-line bg-surface/40 p-6 shadow-[8px_8px_0_0_var(--color-line)] [animation-delay:280ms] sm:p-7">
          {children}
        </div>
      </main>
    </>
  );
}
