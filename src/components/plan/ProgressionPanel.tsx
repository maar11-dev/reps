import type { Progression } from "@/lib/ai/schema";

export function ProgressionPanel({ progression }: { progression: Progression }) {
  return (
    <section
      aria-labelledby="progression-heading"
      className="rounded-[var(--radius-sharp)] border border-volt/30 bg-volt/[0.03] p-6"
    >
      <p className="kicker text-volt">Progression</p>
      <h3 id="progression-heading" className="display mt-1 text-2xl text-bone">
        {progression.strategy}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-bone-dim">{progression.description}</p>

      <ol className="mt-5 flex flex-col gap-2">
        {progression.weeklyAdjustments.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm text-bone">
            <span className="display tabular text-volt" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      {progression.deloadGuidance ? (
        <p className="mt-5 border-t border-line pt-4 text-sm text-bone-dim">
          <span className="font-mono uppercase tracking-widest text-bone">Deload — </span>
          {progression.deloadGuidance}
        </p>
      ) : null}
    </section>
  );
}
