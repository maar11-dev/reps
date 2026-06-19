"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";
import { DayCard } from "@/components/plan/DayCard";
import { Disclaimer } from "@/components/plan/Disclaimer";
import { ProgressionPanel } from "@/components/plan/ProgressionPanel";
import { Button } from "@/components/ui/Button";
import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/ai/labels";
import type { WorkoutPlan } from "@/lib/ai/schema";
import { cn } from "@/lib/utils";

interface PlanViewProps {
  plan: WorkoutPlan;
  onReset?: () => void;
}

export function PlanView({ plan, onReset }: PlanViewProps) {
  const [active, setActive] = useState(0);
  const tabsId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = plan.days.length - 1;
    let next = active;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = active === last ? 0 : active + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = active === 0 ? last : active - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  const activeDay = plan.days[active];

  return (
    <div className="flex flex-col gap-12">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{GOAL_LABELS[plan.goal]}</Tag>
          <Tag>{LEVEL_LABELS[plan.experienceLevel]}</Tag>
          <Tag>
            {plan.daysPerWeek} day{plan.daysPerWeek > 1 ? "s" : ""} / week
          </Tag>
        </div>
        <h1 className="display text-5xl text-bone sm:text-7xl">{plan.title}</h1>
        <p className="max-w-2xl text-lg text-bone-dim">{plan.summary}</p>

        <div className="max-w-2xl rounded-[var(--radius-sharp)] border-l-2 border-volt bg-surface/50 px-5 py-4">
          <p className="kicker text-volt mb-2">The strategy</p>
          <p className="text-sm leading-relaxed text-bone">{plan.rationale}</p>
        </div>
      </header>

      {/* Day tabs */}
      <div className="flex flex-col gap-8">
        <div
          role="tablist"
          aria-label="Training days"
          className="flex flex-wrap gap-2 border-b border-line pb-4"
        >
          {plan.days.map((day, index) => {
            const selected = index === active;
            return (
              <button
                key={day.dayNumber}
                type="button"
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                role="tab"
                id={`${tabsId}-tab-${index}`}
                aria-selected={selected}
                aria-controls={`${tabsId}-panel-${index}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={onTabKeyDown}
                className={cn(
                  "rounded-[var(--radius-sharp)] border px-4 py-2 text-left transition-colors",
                  selected
                    ? "border-volt bg-volt text-volt-ink"
                    : "border-line bg-surface text-bone-dim hover:border-bone-dim hover:text-bone",
                )}
              >
                <span className="block font-mono text-[0.6rem] uppercase tracking-widest opacity-80">
                  Day {String(day.dayNumber).padStart(2, "0")}
                </span>
                <span className="block text-sm font-semibold">{day.title}</span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${tabsId}-panel-${active}`}
          aria-labelledby={`${tabsId}-tab-${active}`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: ARIA tabpanel is focusable per the APG tabs pattern
          tabIndex={0}
        >
          <DayCard day={activeDay} />
        </div>
      </div>

      <ProgressionPanel progression={plan.progression} />

      <Disclaimer />

      {onReset ? (
        <div>
          <Button variant="ghost" onClick={onReset}>
            ← Build another plan
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[var(--radius-sharp)] border border-line bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-bone-dim">
      {children}
    </span>
  );
}
