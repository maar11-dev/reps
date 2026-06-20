"use client";

import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { DayCard } from "@/components/plan/DayCard";
import { Disclaimer } from "@/components/plan/Disclaimer";
import { ProgressionPanel } from "@/components/plan/ProgressionPanel";
import { SavePlanButton } from "@/components/plan/SavePlanButton";
import { Button } from "@/components/ui/Button";
import { GeneratePlanError, requestSwap } from "@/lib/ai/api";
import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/ai/labels";
import type { Equipment, Exercise, WorkoutPlan } from "@/lib/ai/schema";
import { usePlansStore } from "@/lib/store/plans-store";
import { cn } from "@/lib/utils";

interface PlanViewProps {
  /**
   * Optional seed plan. When passed (the generation path / unit tests) it is
   * loaded into the store on mount; when omitted, the view renders whatever draft
   * the store already holds (the "open a saved plan" path).
   */
  plan?: WorkoutPlan;
  onReset?: () => void;
}

export function PlanView({ plan, onReset }: PlanViewProps) {
  const [active, setActive] = useState(0);
  const tabsId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // The plan lives in the store so in-session edits (swaps) survive re-renders
  // and other views can read it. Seed it from the prop when given; render the draft.
  const draft = usePlansStore((s) => s.draft);
  const setDraft = usePlansStore((s) => s.setDraft);
  const swapExerciseInDraft = usePlansStore((s) => s.swapExerciseInDraft);
  useEffect(() => {
    if (plan) setDraft(plan);
  }, [plan, setDraft]);
  const current = draft ?? plan ?? null;

  const [swappingKey, setSwappingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Approximate the athlete's kit from the equipment the plan actually uses, so a
  // swap stays within what they have without threading the original input here.
  const availableEquipment = useMemo<Equipment[]>(() => {
    const set = new Set<Equipment>();
    for (const day of current?.days ?? []) {
      for (const ex of day.exercises) for (const e of ex.equipment) set.add(e);
    }
    return set.size > 0 ? [...set] : ["bodyweight"];
  }, [current]);

  async function handleSwap(dayNumber: number, position: number, exercise: Exercise) {
    if (!current) return;
    const key = `${dayNumber}:${position}`;
    setSwappingKey(key);
    setActionError(null);
    try {
      const day = current.days.find((d) => d.dayNumber === dayNumber);
      const avoid = day ? day.exercises.filter((_, i) => i !== position).map((e) => e.name) : [];
      const next = await requestSwap({
        current: exercise,
        availableEquipment,
        goal: current.goal,
        experienceLevel: current.experienceLevel,
        dayFocus: day?.focus ?? [],
        avoid,
      });
      swapExerciseInDraft(dayNumber, position, next);
    } catch (err) {
      setActionError(
        err instanceof GeneratePlanError ? err.message : "Couldn't swap that exercise. Try again.",
      );
    } finally {
      setSwappingKey(null);
    }
  }

  async function handleExport() {
    if (!current) return;
    setIsExporting(true);
    setActionError(null);
    try {
      const [{ pdf }, { PlanPdf }, { toPdfDocument, planFileName }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/plan/PlanPdf"),
        import("@/lib/plan/pdf-data"),
      ]);
      const blob = await pdf(<PlanPdf model={toPdfDocument(current)} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = planFileName(current);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setActionError("Couldn't build the PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!current) return;
    const last = current.days.length - 1;
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

  if (!current) return null;

  const activeDay = current.days[Math.min(active, current.days.length - 1)];

  return (
    <div className="flex flex-col gap-12">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{GOAL_LABELS[current.goal]}</Tag>
            <Tag>{LEVEL_LABELS[current.experienceLevel]}</Tag>
            <Tag>
              {current.daysPerWeek} day{current.daysPerWeek > 1 ? "s" : ""} / week
            </Tag>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Button
              variant="ghost"
              onClick={handleExport}
              disabled={isExporting}
              aria-busy={isExporting}
            >
              {isExporting ? "Building PDF…" : "Export PDF"}
            </Button>
            <SavePlanButton />
          </div>
        </div>
        <h1 className="display text-5xl text-bone sm:text-7xl">{current.title}</h1>
        <p className="max-w-2xl text-lg text-bone-dim">{current.summary}</p>

        <div className="max-w-2xl rounded-[var(--radius-sharp)] border-l-2 border-volt bg-surface/50 px-5 py-4">
          <p className="kicker text-volt mb-2">The strategy</p>
          <p className="text-sm leading-relaxed text-bone">{current.rationale}</p>
        </div>

        {actionError ? (
          <p role="alert" className="text-sm text-danger">
            {actionError}
          </p>
        ) : null}
      </header>

      {/* Day tabs */}
      <div className="flex flex-col gap-8">
        <div
          role="tablist"
          aria-label="Training days"
          className="flex flex-wrap gap-2 border-b border-line pb-4"
        >
          {current.days.map((day, index) => {
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
          <DayCard day={activeDay} onSwap={handleSwap} swappingKey={swappingKey} />
        </div>
      </div>

      <ProgressionPanel progression={current.progression} />

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
