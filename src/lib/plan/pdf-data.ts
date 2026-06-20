import { formatRest, GOAL_LABELS, LEVEL_LABELS } from "@/lib/ai/labels";
import type { WorkoutPlan } from "@/lib/ai/schema";
import { NON_MEDICAL_DISCLAIMER } from "@/lib/constants";

/**
 * Flatten a `WorkoutPlan` into the rows the PDF document renders.
 *
 * Kept as a pure function (no `@react-pdf/renderer` import) so the data shaping —
 * the part with real logic — is unit-testable without rendering a binary. The
 * non-medical disclaimer is attached here so it can NEVER be dropped from an
 * export (CLAUDE.md: every plan output must carry the disclaimer).
 */

export interface PdfExerciseRow {
  name: string;
  targetMuscles: string;
  prescription: string;
  rest: string;
  intensity?: string;
  cue?: string;
}

export interface PdfDaySection {
  heading: string;
  meta: string;
  rationale: string;
  warmup: string[];
  exercises: PdfExerciseRow[];
}

export interface PdfDocumentModel {
  title: string;
  summary: string;
  tags: string[];
  rationale: string;
  days: PdfDaySection[];
  progression: {
    strategy: string;
    description: string;
    weeklyAdjustments: string[];
    deloadGuidance?: string;
  };
  disclaimer: string;
}

/** A filesystem-safe download name derived from the plan title. */
export function planFileName(plan: WorkoutPlan): string {
  const slug =
    plan.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "workout-plan";
  return `reps-${slug}.pdf`;
}

export function toPdfDocument(plan: WorkoutPlan): PdfDocumentModel {
  return {
    title: plan.title,
    summary: plan.summary,
    tags: [
      GOAL_LABELS[plan.goal],
      LEVEL_LABELS[plan.experienceLevel],
      `${plan.daysPerWeek} day${plan.daysPerWeek > 1 ? "s" : ""} / week`,
    ],
    rationale: plan.rationale,
    days: plan.days.map((day) => ({
      heading: `Day ${String(day.dayNumber).padStart(2, "0")} — ${day.title}`,
      meta: `~${day.estimatedDurationMinutes} min · ${day.focus.join(" / ")}`,
      rationale: day.rationale,
      warmup: day.warmup,
      exercises: day.exercises.map((ex) => ({
        name: ex.name,
        targetMuscles: ex.targetMuscles.join(", "),
        prescription: `${ex.sets}×${ex.reps}`,
        rest: formatRest(ex.restSeconds),
        intensity: ex.rpe,
        cue: ex.cue,
      })),
    })),
    progression: {
      strategy: plan.progression.strategy,
      description: plan.progression.description,
      weeklyAdjustments: plan.progression.weeklyAdjustments,
      deloadGuidance: plan.progression.deloadGuidance,
    },
    disclaimer: NON_MEDICAL_DISCLAIMER,
  };
}
