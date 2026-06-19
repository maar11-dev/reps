import { NON_MEDICAL_DISCLAIMER } from "@/lib/constants";

/**
 * Non-medical disclaimer shown with every plan (CLAUDE.md requirement).
 * Uses <aside> + a clear heading so it is reachable and announced.
 */
export function Disclaimer() {
  return (
    <aside
      aria-label="Safety disclaimer"
      className="rounded-[var(--radius-sharp)] border border-line bg-surface/60 px-5 py-4"
    >
      <p className="kicker text-bone-dim mb-1.5">Heads up</p>
      <p className="text-sm leading-relaxed text-bone-dim">{NON_MEDICAL_DISCLAIMER}</p>
    </aside>
  );
}
