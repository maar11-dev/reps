// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import type { WorkoutPlan } from "@/lib/ai/schema";
import { InMemoryPlansRepository } from "@/lib/db/memory";
import { deletePlan, getPlan, listPlans, savePlan, updatePlan } from "@/lib/db/plans";

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
        },
      ],
      rationale: "Push focus while fresh.",
    },
  ],
  progression: {
    strategy: "Linear progression",
    description: "Add load weekly.",
    weeklyAdjustments: ["Add 2.5kg per week."],
  },
};

const USER = "user-a";
const OTHER = "user-b";

let repo: InMemoryPlansRepository;
beforeEach(() => {
  repo = new InMemoryPlansRepository();
});

describe("plans service", () => {
  it("saves a plan and derives the flat columns from it", async () => {
    const saved = await savePlan(repo, USER, PLAN);
    expect(saved.id).toBeTruthy();
    expect(saved.userId).toBe(USER);
    expect(saved.title).toBe(PLAN.title);
    expect(saved.goal).toBe("strength");
    expect(saved.experienceLevel).toBe("beginner");
    expect(saved.daysPerWeek).toBe(2);
    expect(saved.plan.days).toHaveLength(1);
  });

  it("lists only the requesting user's plans, newest first", async () => {
    const first = await savePlan(repo, USER, PLAN);
    const second = await savePlan(repo, USER, { ...PLAN, title: "Second" });
    await savePlan(repo, OTHER, PLAN);

    const mine = await listPlans(repo, USER);
    expect(mine).toHaveLength(2);
    expect(mine[0].title).toBe("Second");
    expect(mine.map((p) => p.id)).toEqual([second.id, first.id]);
  });

  it("does not leak another user's plan via getPlan", async () => {
    const saved = await savePlan(repo, USER, PLAN);
    expect(await getPlan(repo, OTHER, saved.id)).toBeNull();
    expect(await getPlan(repo, USER, saved.id)).not.toBeNull();
  });

  it("rejects a plan that does not match the contract", async () => {
    await expect(savePlan(repo, USER, { title: "broken" })).rejects.toThrow();
  });

  it("updates the stored plan and refreshes the denormalised columns", async () => {
    const saved = await savePlan(repo, USER, PLAN);
    const edited: WorkoutPlan = { ...PLAN, title: "Edited", goal: "hypertrophy" };
    const updated = await updatePlan(repo, USER, saved.id, edited);
    expect(updated?.title).toBe("Edited");
    expect(updated?.goal).toBe("hypertrophy");
    expect(updated?.plan.goal).toBe("hypertrophy");
  });

  it("will not update a plan owned by another user", async () => {
    const saved = await savePlan(repo, USER, PLAN);
    expect(await updatePlan(repo, OTHER, saved.id, PLAN)).toBeNull();
  });

  it("deletes only the owner's plan", async () => {
    const saved = await savePlan(repo, USER, PLAN);
    expect(await deletePlan(repo, OTHER, saved.id)).toBe(false);
    expect(await deletePlan(repo, USER, saved.id)).toBe(true);
    expect(await getPlan(repo, USER, saved.id)).toBeNull();
  });
});
