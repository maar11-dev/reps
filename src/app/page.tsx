import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GOAL_LABELS } from "@/lib/ai/labels";
import { GOALS } from "@/lib/ai/schema";

/**
 * Landing page — Server Component (fast first paint; CLAUDE.md keeps this lean).
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Hero */}
        <section className="flex flex-col gap-8 py-20 sm:py-28">
          <p className="kicker text-volt">AI strength &amp; conditioning</p>
          <h1 className="display text-6xl leading-[0.9] text-bone sm:text-8xl">
            Train with a<br />
            <span className="text-volt">plan</span>, not a<br />
            guess.
          </h1>
          <p className="max-w-xl text-lg text-bone-dim">
            Tell Reps your goal, your level, and the gear you have. Get a structured weekly program
            — sets, reps, rest, progression, and the reasoning behind every choice.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/build"
              className="inline-flex items-center gap-2 rounded-[var(--radius-sharp)] bg-volt px-7 py-3.5 font-mono text-sm uppercase tracking-[0.15em] text-volt-ink transition-colors hover:bg-volt-dim"
            >
              Build my plan →
            </Link>
            <span className="font-mono text-xs uppercase tracking-widest text-bone-dim">
              No sign-up · ~10 seconds
            </span>
          </div>
        </section>

        {/* What you tell it */}
        <section className="border-t border-line py-16">
          <p className="kicker text-bone-dim mb-8">Built around your goal</p>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-sharp)] border border-line bg-line sm:grid-cols-5">
            {GOALS.map((goal) => (
              <li key={goal} className="bg-surface px-4 py-6 text-center">
                <span className="display block text-xl text-bone">{GOAL_LABELS[goal]}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="grid gap-8 border-t border-line py-16 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Describe yourself",
              d: "Goal, experience, days per week, and the equipment you own.",
            },
            {
              n: "02",
              t: "We structure it",
              d: "A schema-validated plan — every field typed, nothing free-text.",
            },
            {
              n: "03",
              t: "Train the week",
              d: "Browse each day, follow the progression, see the why behind it.",
            },
          ].map((step) => (
            <div key={step.n} className="flex flex-col gap-3">
              <span className="display tabular text-5xl text-volt">{step.n}</span>
              <h3 className="display text-2xl text-bone">{step.t}</h3>
              <p className="text-sm text-bone-dim">{step.d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
          <p className="text-xs text-bone-dim">
            Reps gives general fitness suggestions, not medical advice. Consult a professional
            before starting any program.
          </p>
        </div>
      </footer>
    </>
  );
}
