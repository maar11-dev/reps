import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GOAL_LABELS } from "@/lib/ai/labels";
import { GOALS } from "@/lib/ai/schema";

/**
 * Landing page — Server Component (fast first paint; CLAUDE.md keeps this lean).
 * "Volt Brutalism": giant condensed caps, exposed grid, hard offset shadows.
 */
export default function HomePage() {
  const steps = [
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
  ];
  const marquee = ["STRENGTH", "HYPERTROPHY", "ENDURANCE", "FAT LOSS", "GENERAL FITNESS"];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Hero */}
        <section className="grid items-center gap-10 pt-12 pb-12 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="flex flex-col gap-6">
            <span className="rise inline-flex w-fit items-center gap-2 border-2 border-volt bg-volt/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-volt [animation-delay:40ms]">
              <span className="h-2 w-2 bg-volt" aria-hidden="true" />
              AI strength &amp; conditioning
            </span>

            <h1 className="display rise text-bone [animation-delay:120ms] text-[clamp(2.75rem,6vw,5rem)]">
              Train with a{" "}
              <span className="inline-block -rotate-1 border-2 border-volt-ink bg-volt px-2 text-volt-ink">
                plan
              </span>
              ,<br />
              not a <span className="text-volt">guess.</span>
            </h1>

            <p className="rise max-w-md text-lg text-bone-dim [animation-delay:220ms]">
              Tell Reps your goal, your level, and the gear you have. Get a structured weekly
              program — sets, reps, rest, progression, and the reasoning behind every choice.
            </p>

            <div className="rise flex flex-wrap items-center gap-5 [animation-delay:300ms]">
              <Link
                href="/build"
                className="press inline-flex items-center gap-2 border-2 border-volt-ink bg-volt px-8 py-4 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-volt-ink shadow-[5px_5px_0_0_var(--color-bone)]"
              >
                Build my plan →
              </Link>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-bone-dim">
                No sign-up · ~10 seconds
              </span>
            </div>
          </div>

          {/* Crowned-barbell sticker — framed so its light bg reads as intentional */}
          <div className="rise flex justify-center lg:justify-end [animation-delay:360ms]">
            <div className="rotate-2 border-2 border-volt-ink bg-bone p-2 shadow-[10px_10px_0_0_var(--color-volt)]">
              <Image
                src="/barra.jpg"
                alt="Illustration of a barbell wearing a crown"
                width={626}
                height={351}
                priority
                className="h-auto w-full max-w-sm sm:max-w-md"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Marquee band — full-bleed brutalist ticker */}
      <div className="scan-line overflow-hidden border-y-2 border-bone bg-volt py-3 text-volt-ink">
        <div className="flex w-max animate-[reps-marquee_24s_linear_infinite] gap-6 whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex gap-6" aria-hidden={dup === 1}>
              {marquee.map((word) => (
                <span
                  key={word}
                  className="font-mono text-sm font-bold uppercase tracking-[0.25em]"
                >
                  {word} <span className="px-2">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Built around your goal */}
        <section className="py-16 sm:py-20">
          <p className="kicker text-volt mb-8">Built around your goal</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {GOALS.map((goal) => (
              <li key={goal}>
                <span className="press flex h-full items-center justify-center border-2 border-line bg-surface px-4 py-8 text-center transition-colors hover:border-volt hover:bg-volt hover:text-volt-ink">
                  <span className="display text-xl">{GOAL_LABELS[goal]}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="grid gap-4 border-t-2 border-line py-16 sm:grid-cols-3 sm:py-20">
          {steps.map((step) => (
            <div
              key={step.n}
              className="flex flex-col gap-3 border-2 border-line bg-surface p-6 transition-colors hover:border-volt"
            >
              <span className="display tabular text-6xl text-volt">{step.n}</span>
              <h3 className="display text-2xl text-bone">{step.t}</h3>
              <p className="text-sm leading-relaxed text-bone-dim">{step.d}</p>
            </div>
          ))}
        </section>

        {/* Big closing CTA */}
        <section className="mb-20 border-2 border-volt bg-volt/[0.04] p-8 text-center sm:p-14">
          <h2 className="display text-4xl text-bone sm:text-6xl">
            Your week, <span className="text-volt">structured.</span>
          </h2>
          <Link
            href="/build"
            className="press mt-7 inline-flex items-center gap-2 border-2 border-volt-ink bg-volt px-8 py-4 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-volt-ink shadow-[5px_5px_0_0_var(--color-bone)]"
          >
            Start building →
          </Link>
        </section>
      </main>

      <footer className="border-t-2 border-line">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <p className="font-mono text-xs leading-relaxed text-bone-dim">
            Reps gives general fitness suggestions, not medical advice. Consult a professional
            before starting any program.
          </p>
        </div>
      </footer>
    </>
  );
}
