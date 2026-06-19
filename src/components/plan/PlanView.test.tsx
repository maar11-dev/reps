import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PlanView } from "@/components/plan/PlanView";
import type { WorkoutPlan } from "@/lib/ai/schema";
import { NON_MEDICAL_DISCLAIMER } from "@/lib/constants";

const PLAN: WorkoutPlan = {
  title: "Beginner Strength — 2-Day Split",
  summary: "A focused two-day strength plan.",
  goal: "strength",
  experienceLevel: "beginner",
  daysPerWeek: 2,
  rationale: "Two full-body-ish days give plenty of recovery for a new lifter.",
  days: [
    {
      dayNumber: 1,
      title: "Upper Body",
      focus: ["Chest", "Back"],
      estimatedDurationMinutes: 50,
      warmup: ["5 min cardio"],
      exercises: [
        {
          name: "Barbell Bench Press",
          targetMuscles: ["Chest", "Triceps"],
          sets: 5,
          reps: "4-6",
          restSeconds: 180,
          equipment: ["barbell"],
          rpe: "RPE 8",
          cue: "Pin the shoulder blades.",
        },
      ],
      rationale: "Push focus while fresh.",
    },
    {
      dayNumber: 2,
      title: "Lower Body",
      focus: ["Quads", "Glutes"],
      estimatedDurationMinutes: 50,
      warmup: ["Hip mobility"],
      exercises: [
        {
          name: "Barbell Back Squat",
          targetMuscles: ["Quads", "Glutes"],
          sets: 5,
          reps: "4-6",
          restSeconds: 180,
          equipment: ["barbell"],
        },
      ],
      rationale: "Lower body strength.",
    },
  ],
  progression: {
    strategy: "Linear progression",
    description: "Add load weekly.",
    weeklyAdjustments: ["Add 2.5kg per week."],
    deloadGuidance: "Deload every 4th week.",
  },
};

describe("PlanView", () => {
  it("renders the plan title, first day, and an exercise", () => {
    render(<PlanView plan={PLAN} />);
    expect(screen.getByRole("heading", { name: /beginner strength/i })).toBeInTheDocument();
    expect(screen.getByText("Barbell Bench Press")).toBeInTheDocument();
  });

  it("always shows the non-medical disclaimer", () => {
    render(<PlanView plan={PLAN} />);
    expect(screen.getByText(NON_MEDICAL_DISCLAIMER)).toBeInTheDocument();
  });

  it("switches days when another tab is selected", async () => {
    const user = userEvent.setup();
    render(<PlanView plan={PLAN} />);

    expect(screen.getByText("Barbell Bench Press")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /lower body/i }));
    expect(screen.getByText("Barbell Back Squat")).toBeInTheDocument();
  });

  it("renders the progression strategy", () => {
    render(<PlanView plan={PLAN} />);
    expect(screen.getByRole("heading", { name: /linear progression/i })).toBeInTheDocument();
  });
});
