import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
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
        <section className="relative pt-12 pb-12 sm:pt-16">
          {/* Crowned-barbell — recolored into a volt duotone so it reads as an intentional brand illustration */}
          <div
            className="rise pointer-events-none absolute -z-10 bottom-1 right-[-20%] w-[82vw] opacity-40 [animation-delay:360ms] sm:bottom-auto sm:top-1/2 sm:w-[min(76vw,700px)] sm:-translate-y-1/2 sm:right-[-14%] sm:opacity-60 lg:right-[-8%]"
            aria-hidden="true"
          >
            <Image
              src="/barra.png"
              alt=""
              width={626}
              height={351}
              priority
              className="reps-drift h-auto w-full max-w-none -rotate-3 [filter:grayscale(1)_sepia(1)_hue-rotate(35deg)_saturate(4)_brightness(1.05)_contrast(1.05)] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_72%)]"
            />
          </div>

          <div className="relative flex max-w-xl flex-col gap-6">
            <span className="rise inline-flex w-fit items-center gap-2 border-2 border-volt bg-volt/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-volt [animation-delay:40ms]">
              <span className="reps-pulse h-2 w-2 bg-volt" aria-hidden="true" />
              AI strength &amp; conditioning
            </span>

            <h1 className="display rise text-bone [animation-delay:120ms] text-[clamp(2.75rem,6vw,5rem)]">
              Train with a{" "}
              <span className="whitespace-nowrap">
                <span className="reps-flicker inline-block -rotate-1 border-2 border-volt-ink bg-volt px-2 text-volt-ink [animation-delay:760ms]">
                  plan
                </span>
                ,
              </span>
              <br />
              not a <span className="reps-flicker text-volt [animation-delay:760ms]">guess.</span>
            </h1>

            <p className="rise max-w-md text-lg text-bone-dim [animation-delay:220ms]">
              Tell Reps your goal, your level, and the gear you have. Get a structured weekly
              program — sets, reps, rest, progression, and the reasoning behind every choice.
            </p>

            <div className="rise flex flex-wrap items-center gap-5 [animation-delay:300ms]">
              <Link
                href="/build"
                className="press group relative inline-flex items-center gap-2 overflow-hidden border-2 border-volt-ink bg-volt px-8 py-4 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-volt-ink shadow-[5px_5px_0_0_var(--color-bone)] before:absolute before:inset-y-0 before:-left-full before:w-1/2 before:-skew-x-12 before:bg-volt-ink/15 before:transition-[left] before:duration-500 before:ease-out hover:before:left-[150%]"
              >
                <span className="relative">Build my plan</span>
                <span className="relative transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-bone-dim">
                No sign-up · ~10 seconds
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Marquee band — full-bleed brutalist ticker */}
      <div className="scan-line overflow-hidden border-y-2 border-bone bg-volt py-3 text-volt-ink">
        <div className="flex w-max animate-[reps-marquee_24s_linear_infinite] gap-6 whitespace-nowrap hover:[animation-play-state:paused]">
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
          <Reveal className="mb-8">
            <p className="kicker text-volt">Built around your goal</p>
          </Reveal>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {GOALS.map((goal, i) => (
              <Reveal as="li" key={goal} delayMs={i * 70}>
                <span className="press relative flex h-full items-center justify-center overflow-hidden border-2 border-line bg-surface px-4 py-8 text-center transition-colors hover:border-volt hover:text-volt-ink before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:bg-volt before:transition-transform before:duration-300 before:ease-out hover:before:scale-y-100">
                  <span className="display relative z-10 text-xl">{GOAL_LABELS[goal]}</span>
                </span>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="grid gap-4 border-t-2 border-line py-16 sm:grid-cols-3 sm:py-20">
          {steps.map((step, i) => (
            <Reveal key={step.n} delayMs={i * 120} className="h-full">
              <div className="press group flex h-full flex-col gap-3 border-2 border-line bg-surface p-6 transition-[transform,box-shadow,border-color] hover:border-volt hover:shadow-[8px_8px_0_0_var(--color-volt)]">
                <span className="display tabular text-6xl text-volt transition-transform duration-300 group-hover:-translate-y-1">
                  {step.n}
                </span>
                <h3 className="display text-2xl text-bone">{step.t}</h3>
                <p className="text-sm leading-relaxed text-bone-dim">{step.d}</p>
              </div>
            </Reveal>
          ))}
        </section>

        {/* Big closing CTA */}
        <Reveal className="mb-20">
          <section className="border-2 border-volt bg-volt/[0.04] p-8 text-center sm:p-14">
            <h2 className="display text-4xl text-bone sm:text-6xl">
              Your week, <span className="text-volt">structured.</span>
            </h2>
            <Link
              href="/build"
              className="press group relative mt-7 inline-flex items-center gap-2 overflow-hidden border-2 border-volt-ink bg-volt px-8 py-4 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-volt-ink shadow-[5px_5px_0_0_var(--color-bone)] before:absolute before:inset-y-0 before:-left-full before:w-1/2 before:-skew-x-12 before:bg-volt-ink/15 before:transition-[left] before:duration-500 before:ease-out hover:before:left-[150%]"
            >
              <span className="relative">Start building</span>
              <span className="relative transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </section>
        </Reveal>
      </main>

      <footer className="border-t-2 border-line">
        <div className="mx-auto flex max-w-6xl items-start gap-4 px-5 py-8 sm:px-8">
          <Image
            src="/logo.png"
            alt=""
            aria-hidden="true"
            width={512}
            height={512}
            className="h-6 w-6 shrink-0 border-2 border-line object-cover"
          />
          <p className="font-mono text-xs leading-relaxed text-bone-dim">
            Reps gives general fitness suggestions, not medical advice. Consult a professional
            before starting any program.
          </p>
        </div>
      </footer>
    </>
  );
}
