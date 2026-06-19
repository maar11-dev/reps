// @vitest-environment node
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatePlan } from "@/lib/ai/generate";
import { type GeneratePlanInput, workoutPlanSchema } from "@/lib/ai/schema";

/**
 * Live integration smoke test. SKIPPED unless a provider key is present in the
 * environment, so the default `pnpm test` run stays hermetic (no network). Run
 * it deliberately with a key set to verify real end-to-end generation.
 */
const hasKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
const maybe = hasKey ? it : it.skip;

describe("live LLM generation", () => {
  maybe(
    "returns a schema-valid plan from the real provider",
    async () => {
      process.env.REPS_USE_MOCK = "false";
      const input: GeneratePlanInput = {
        goal: "hypertrophy",
        experienceLevel: "intermediate",
        daysPerWeek: 3,
        availableEquipment: ["dumbbells", "bodyweight"],
      };
      const plan = await generatePlan(input);

      // Persist the raw model output so we can eyeball schema fit afterwards.
      mkdirSync(".playwright-verify", { recursive: true });
      writeFileSync(".playwright-verify/real-plan.json", JSON.stringify(plan, null, 2));

      expect(() => workoutPlanSchema.parse(plan)).not.toThrow();
      expect(plan.days.length).toBeGreaterThanOrEqual(1);
      expect(plan.rationale.length).toBeGreaterThan(0);
    },
    60_000,
  );
});
