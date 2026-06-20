// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { WorkoutPlan } from "@/lib/ai/schema";
import { NON_MEDICAL_DISCLAIMER } from "@/lib/constants";
import { planFileName, toPdfDocument } from "@/lib/plan/pdf-data";

const PLAN: WorkoutPlan = {
  title: "Intermediate Hypertrophy — 2-Day Split",
  summary: "A two-day muscle plan.",
  goal: "hypertrophy",
  experienceLevel: "intermediate",
  daysPerWeek: 2,
  rationale: "Balanced volume across the week.",
  days: [
    {
      dayNumber: 1,
      title: "Upper",
      focus: ["Chest", "Back"],
      estimatedDurationMinutes: 55,
      warmup: ["5 min cardio", "band pull-aparts"],
      exercises: [
        {
          name: "Barbell Bench Press",
          targetMuscles: ["Chest", "Triceps"],
          sets: 4,
          reps: "8-12",
          restSeconds: 90,
          equipment: ["barbell"],
          rpe: "RPE 8",
          cue: "Pin the shoulder blades.",
        },
        {
          name: "Dumbbell Row",
          targetMuscles: ["Back", "Biceps"],
          sets: 4,
          reps: "8-12",
          restSeconds: 90,
          equipment: ["dumbbells"],
        },
      ],
      rationale: "Push/pull balance.",
    },
    {
      dayNumber: 2,
      title: "Lower",
      focus: ["Quads", "Glutes"],
      estimatedDurationMinutes: 50,
      warmup: ["hip mobility"],
      exercises: [
        {
          name: "Barbell Back Squat",
          targetMuscles: ["Quads", "Glutes"],
          sets: 4,
          reps: "8-12",
          restSeconds: 120,
          equipment: ["barbell"],
        },
      ],
      rationale: "Lower body focus.",
    },
  ],
  progression: {
    strategy: "Double progression",
    description: "Add reps then load.",
    weeklyAdjustments: ["Add a rep per set.", "Increase load at the top of the range."],
    deloadGuidance: "Lighter week every 6 weeks.",
  },
};

describe("toPdfDocument", () => {
  it("includes every day and every exercise", () => {
    const doc = toPdfDocument(PLAN);
    expect(doc.days).toHaveLength(PLAN.days.length);
    expect(doc.days[0].exercises).toHaveLength(2);
    expect(doc.days[1].exercises).toHaveLength(1);
  });

  it("formats headings, prescriptions and rest", () => {
    const doc = toPdfDocument(PLAN);
    expect(doc.days[0].heading).toBe("Day 01 — Upper");
    const first = doc.days[0].exercises[0];
    expect(first.prescription).toBe("4×8-12");
    expect(first.rest).toBe("90s");
    expect(doc.days[1].exercises[0].rest).toBe("2m");
    expect(first.intensity).toBe("RPE 8");
    expect(first.cue).toBe("Pin the shoulder blades.");
  });

  it("carries the plan-level fields and tags", () => {
    const doc = toPdfDocument(PLAN);
    expect(doc.title).toBe(PLAN.title);
    expect(doc.summary).toBe(PLAN.summary);
    expect(doc.rationale).toBe(PLAN.rationale);
    expect(doc.tags).toContain("Muscle / Hypertrophy");
    expect(doc.tags).toContain("Intermediate");
    expect(doc.tags).toContain("2 days / week");
    expect(doc.progression.weeklyAdjustments).toHaveLength(2);
    expect(doc.progression.deloadGuidance).toBeTruthy();
  });

  it("always attaches the non-medical disclaimer", () => {
    expect(toPdfDocument(PLAN).disclaimer).toBe(NON_MEDICAL_DISCLAIMER);
  });
});

describe("planFileName", () => {
  it("produces a safe, slugged pdf name", () => {
    expect(planFileName(PLAN)).toBe("reps-intermediate-hypertrophy-2-day-split.pdf");
  });

  it("falls back when the title has no usable characters", () => {
    expect(planFileName({ ...PLAN, title: "!!!" })).toBe("reps-workout-plan.pdf");
  });
});
