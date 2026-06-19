// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mockPlan } from "@/lib/ai/mock";
import { type GeneratePlanInput, workoutPlanSchema } from "@/lib/ai/schema";

const base: GeneratePlanInput = {
  goal: "hypertrophy",
  experienceLevel: "intermediate",
  daysPerWeek: 3,
  availableEquipment: ["full_gym"],
};

describe("mockPlan", () => {
  it("always produces a plan that validates against the output schema", () => {
    for (let days = 1; days <= 7; days++) {
      const plan = mockPlan({ ...base, daysPerWeek: days });
      expect(() => workoutPlanSchema.parse(plan)).not.toThrow();
    }
  });

  it("produces exactly the requested number of days", () => {
    for (let days = 1; days <= 7; days++) {
      const plan = mockPlan({ ...base, daysPerWeek: days });
      expect(plan.days).toHaveLength(days);
    }
  });

  it("echoes the input goal, level and days", () => {
    const plan = mockPlan({ ...base, goal: "strength", experienceLevel: "advanced" });
    expect(plan.goal).toBe("strength");
    expect(plan.experienceLevel).toBe("advanced");
    expect(plan.daysPerWeek).toBe(3);
  });

  it("only prescribes exercises usable with the available equipment", () => {
    // Bodyweight-only: every exercise must resolve to a bodyweight variant.
    const plan = mockPlan({ ...base, availableEquipment: ["bodyweight"], daysPerWeek: 4 });
    const allEquipment = plan.days.flatMap((d) => d.exercises).flatMap((e) => e.equipment);
    expect(allEquipment.every((e) => e === "bodyweight")).toBe(true);
  });

  it("includes a rationale on the plan and on every day", () => {
    const plan = mockPlan(base);
    expect(plan.rationale.length).toBeGreaterThan(0);
    expect(plan.days.every((d) => d.rationale.length > 0)).toBe(true);
  });

  it("uses heavier, lower-rep prescriptions for strength than for endurance", () => {
    const strength = mockPlan({ ...base, goal: "strength" });
    const endurance = mockPlan({ ...base, goal: "endurance" });
    const firstRest = (p: ReturnType<typeof mockPlan>) => p.days[0].exercises[0].restSeconds;
    expect(firstRest(strength)).toBeGreaterThan(firstRest(endurance));
  });
});
