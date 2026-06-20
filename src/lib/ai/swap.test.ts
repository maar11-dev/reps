// @vitest-environment node
import { describe, expect, it } from "vitest";
import { exerciseSchema, type SwapExerciseInput } from "@/lib/ai/schema";
import { mockSwap, swapExercise } from "@/lib/ai/swap";

const base: SwapExerciseInput = {
  current: {
    name: "Barbell Bench Press",
    targetMuscles: ["Chest", "Triceps", "Front Delts"],
    sets: 4,
    reps: "8-12",
    restSeconds: 90,
    equipment: ["barbell"],
    rpe: "RPE 8",
  },
  availableEquipment: ["full_gym"],
  goal: "hypertrophy",
  experienceLevel: "intermediate",
  dayFocus: ["Chest", "Shoulders", "Triceps"],
};

describe("mockSwap", () => {
  it("returns a schema-valid exercise", () => {
    const out = mockSwap(base);
    expect(() => exerciseSchema.parse(out)).not.toThrow();
  });

  it("suggests a DIFFERENT exercise than the current one", () => {
    const out = mockSwap(base);
    expect(out.name).not.toBe(base.current.name);
  });

  it("shares at least one target muscle with the original", () => {
    const out = mockSwap(base);
    const original = new Set(base.current.targetMuscles);
    expect(out.targetMuscles.some((m) => original.has(m))).toBe(true);
  });

  it("only uses equipment the athlete has (bodyweight-only)", () => {
    const out = mockSwap({
      ...base,
      current: {
        name: "Plank",
        targetMuscles: ["Core"],
        sets: 3,
        reps: "30-45s",
        restSeconds: 30,
        equipment: ["bodyweight"],
      },
      availableEquipment: ["bodyweight"],
      dayFocus: ["Core"],
    });
    expect(out.name).not.toBe("Plank");
    expect(out.equipment.every((e) => e === "bodyweight")).toBe(true);
  });

  it("does not return an exercise listed in `avoid`", () => {
    // Force the obvious same-pattern pick into the avoid list.
    const out = mockSwap({ ...base, avoid: ["Machine Chest Press", "Dumbbell Shoulder Press"] });
    expect(["Machine Chest Press", "Dumbbell Shoulder Press"]).not.toContain(out.name);
  });

  it("carries over the original prescription (sets / reps / rest)", () => {
    const out = mockSwap(base);
    expect(out.sets).toBe(base.current.sets);
    expect(out.reps).toBe(base.current.reps);
    expect(out.restSeconds).toBe(base.current.restSeconds);
  });
});

describe("swapExercise (mock mode)", () => {
  it("resolves to a valid exercise without touching the network", async () => {
    const out = await swapExercise(base);
    expect(() => exerciseSchema.parse(out)).not.toThrow();
    expect(out.name).not.toBe(base.current.name);
  });
});
