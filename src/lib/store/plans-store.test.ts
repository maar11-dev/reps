import { beforeEach, describe, expect, it } from "vitest";
import type { Exercise, WorkoutPlan } from "@/lib/ai/schema";
import type { SavedPlan } from "@/lib/db/types";
import { initialPlansState, usePlansStore } from "@/lib/store/plans-store";

const PLAN: WorkoutPlan = {
  title: "Test Plan",
  summary: "Summary.",
  goal: "hypertrophy",
  experienceLevel: "intermediate",
  daysPerWeek: 2,
  rationale: "Overall rationale.",
  days: [
    {
      dayNumber: 1,
      title: "Upper",
      focus: ["Chest"],
      estimatedDurationMinutes: 50,
      warmup: ["cardio"],
      exercises: [
        {
          name: "Bench",
          targetMuscles: ["Chest"],
          sets: 4,
          reps: "8-12",
          restSeconds: 90,
          equipment: ["barbell"],
        },
        {
          name: "Row",
          targetMuscles: ["Back"],
          sets: 4,
          reps: "8-12",
          restSeconds: 90,
          equipment: ["barbell"],
        },
      ],
      rationale: "Push/pull.",
    },
    {
      dayNumber: 2,
      title: "Lower",
      focus: ["Quads"],
      estimatedDurationMinutes: 50,
      warmup: ["mobility"],
      exercises: [
        {
          name: "Squat",
          targetMuscles: ["Quads"],
          sets: 4,
          reps: "8-12",
          restSeconds: 90,
          equipment: ["barbell"],
        },
      ],
      rationale: "Legs.",
    },
  ],
  progression: {
    strategy: "Double progression",
    description: "Add reps then load.",
    weeklyAdjustments: ["Add a rep."],
  },
};

const substitute: Exercise = {
  name: "Dumbbell Press",
  targetMuscles: ["Chest"],
  sets: 4,
  reps: "8-12",
  restSeconds: 90,
  equipment: ["dumbbells"],
};

const savedPlan = (id: string): SavedPlan => ({
  id,
  userId: "u1",
  title: PLAN.title,
  goal: PLAN.goal,
  experienceLevel: PLAN.experienceLevel,
  daysPerWeek: PLAN.daysPerWeek,
  plan: PLAN,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

beforeEach(() => {
  usePlansStore.setState(initialPlansState);
});

describe("plans store", () => {
  it("setDraft loads a plan clean (not dirty)", () => {
    usePlansStore.getState().setDraft(PLAN);
    expect(usePlansStore.getState().draft).toEqual(PLAN);
    expect(usePlansStore.getState().isDirty).toBe(false);
  });

  it("swapExerciseInDraft replaces the right exercise, marks dirty, and does not mutate the original", () => {
    usePlansStore.getState().setDraft(PLAN);
    usePlansStore.getState().swapExerciseInDraft(1, 1, substitute);

    const draft = usePlansStore.getState().draft;
    expect(draft?.days[0].exercises[1].name).toBe("Dumbbell Press");
    // Sibling and other day untouched.
    expect(draft?.days[0].exercises[0].name).toBe("Bench");
    expect(draft?.days[1].exercises[0].name).toBe("Squat");
    expect(usePlansStore.getState().isDirty).toBe(true);
    // Original input object is not mutated.
    expect(PLAN.days[0].exercises[1].name).toBe("Row");
  });

  it("swapExerciseInDraft is a no-op when there is no draft", () => {
    usePlansStore.getState().swapExerciseInDraft(1, 0, substitute);
    expect(usePlansStore.getState().draft).toBeNull();
  });

  it("resetDraft clears the draft and dirty flag", () => {
    usePlansStore.getState().setDraft(PLAN);
    usePlansStore.getState().swapExerciseInDraft(1, 0, substitute);
    usePlansStore.getState().resetDraft();
    expect(usePlansStore.getState().draft).toBeNull();
    expect(usePlansStore.getState().isDirty).toBe(false);
  });

  it("addSavedPlan prepends and de-dupes by id", () => {
    usePlansStore.getState().addSavedPlan(savedPlan("a"));
    usePlansStore.getState().addSavedPlan(savedPlan("b"));
    usePlansStore.getState().addSavedPlan({ ...savedPlan("a"), title: "Replaced" });

    const list = usePlansStore.getState().savedPlans;
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe("a");
    expect(list[0].title).toBe("Replaced");
  });

  it("removeSavedPlan drops the matching id", () => {
    usePlansStore.getState().setSavedPlans([savedPlan("a"), savedPlan("b")]);
    usePlansStore.getState().removeSavedPlan("a");
    expect(usePlansStore.getState().savedPlans.map((p) => p.id)).toEqual(["b"]);
  });

  it("setDraft marks the plan as unsaved (no draftSavedId)", () => {
    usePlansStore.setState({ draftSavedId: "stale" });
    usePlansStore.getState().setDraft(PLAN);
    expect(usePlansStore.getState().draftSavedId).toBeNull();
    expect(usePlansStore.getState().isDirty).toBe(false);
  });

  it("loadSavedPlan tracks the saved id and loads its plan clean", () => {
    const saved = savedPlan("xyz");
    usePlansStore.getState().loadSavedPlan(saved);
    expect(usePlansStore.getState().draft).toEqual(saved.plan);
    expect(usePlansStore.getState().draftSavedId).toBe("xyz");
    expect(usePlansStore.getState().isDirty).toBe(false);
  });

  it("markSaved records the id, clears dirty, and upserts into the library", () => {
    usePlansStore.getState().setDraft(PLAN);
    usePlansStore.getState().swapExerciseInDraft(1, 0, substitute);
    expect(usePlansStore.getState().isDirty).toBe(true);

    usePlansStore.getState().markSaved(savedPlan("saved-1"));
    expect(usePlansStore.getState().draftSavedId).toBe("saved-1");
    expect(usePlansStore.getState().isDirty).toBe(false);
    expect(usePlansStore.getState().savedPlans.map((p) => p.id)).toEqual(["saved-1"]);
  });

  it("resetDraft clears the saved id too", () => {
    usePlansStore.getState().loadSavedPlan(savedPlan("abc"));
    usePlansStore.getState().resetDraft();
    expect(usePlansStore.getState().draft).toBeNull();
    expect(usePlansStore.getState().draftSavedId).toBeNull();
  });
});
