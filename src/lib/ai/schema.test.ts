import { describe, expect, it } from "vitest";
import { generatePlanInputSchema, workoutPlanSchema } from "@/lib/ai/schema";

describe("generatePlanInputSchema", () => {
  const valid = {
    goal: "hypertrophy",
    experienceLevel: "beginner",
    daysPerWeek: 3,
    availableEquipment: ["dumbbells"],
  };

  it("accepts a minimal valid input", () => {
    expect(generatePlanInputSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = generatePlanInputSchema.safeParse({
      ...valid,
      sessionLengthMinutes: 60,
      notes: "bad knee",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty equipment list", () => {
    const result = generatePlanInputSchema.safeParse({ ...valid, availableEquipment: [] });
    expect(result.success).toBe(false);
  });

  it("rejects daysPerWeek out of range", () => {
    expect(generatePlanInputSchema.safeParse({ ...valid, daysPerWeek: 0 }).success).toBe(false);
    expect(generatePlanInputSchema.safeParse({ ...valid, daysPerWeek: 8 }).success).toBe(false);
  });

  it("rejects an unknown goal", () => {
    expect(generatePlanInputSchema.safeParse({ ...valid, goal: "powerlifting" }).success).toBe(
      false,
    );
  });

  it("rejects an unknown equipment value", () => {
    const result = generatePlanInputSchema.safeParse({
      ...valid,
      availableEquipment: ["spaceship"],
    });
    expect(result.success).toBe(false);
  });
});

describe("workoutPlanSchema", () => {
  it("rejects a plan with no days", () => {
    const result = workoutPlanSchema.safeParse({
      title: "x",
      summary: "x",
      goal: "strength",
      experienceLevel: "advanced",
      daysPerWeek: 3,
      rationale: "x",
      days: [],
      progression: { strategy: "x", description: "x", weeklyAdjustments: [] },
    });
    expect(result.success).toBe(false);
  });
});
