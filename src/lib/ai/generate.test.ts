// @vitest-environment node

import { generateObject } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generatePlan } from "@/lib/ai/generate";
import { mockPlan } from "@/lib/ai/mock";
import type { GeneratePlanInput } from "@/lib/ai/schema";

// Mock only `generateObject`; keep the rest of the SDK (incl. NoObjectGeneratedError) real.
vi.mock("ai", async (importActual) => {
  const actual = await importActual<typeof import("ai")>();
  return { ...actual, generateObject: vi.fn() };
});

const input: GeneratePlanInput = {
  goal: "endurance",
  experienceLevel: "advanced",
  daysPerWeek: 2,
  availableEquipment: ["pull_up_bar"],
};

/** A schema-valid plan object, as `generateObject` would resolve it. */
const validResult = () => ({ object: mockPlan(input) });

/** Mimics the SDK's schema-mismatch failure (its real name is AI_NoObjectGeneratedError). */
function noObjectError(): Error {
  return Object.assign(new Error("No object generated: response did not match schema."), {
    name: "AI_NoObjectGeneratedError",
  });
}

const mockedGenerate = vi.mocked(generateObject);

beforeEach(() => {
  mockedGenerate.mockReset();
  process.env.REPS_USE_MOCK = "false";
  process.env.GROQ_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.REPS_USE_MOCK;
  delete process.env.GROQ_API_KEY;
});

describe("generatePlan retry behaviour", () => {
  it("retries a transient schema failure and returns the next valid plan", async () => {
    mockedGenerate
      .mockRejectedValueOnce(noObjectError())
      .mockRejectedValueOnce(noObjectError())
      // biome-ignore lint/suspicious/noExplicitAny: the SDK return type is large; the code only reads `.object`
      .mockResolvedValueOnce(validResult() as any);

    const plan = await generatePlan(input);
    expect(plan.days).toHaveLength(2);
    expect(mockedGenerate).toHaveBeenCalledTimes(3);
  });

  it("gives up after the max attempts and rethrows", async () => {
    mockedGenerate.mockRejectedValue(noObjectError());

    await expect(generatePlan(input)).rejects.toThrow(/No object generated/);
    expect(mockedGenerate).toHaveBeenCalledTimes(3);
  });

  it("does not retry a non-schema error (e.g. network failure)", async () => {
    mockedGenerate.mockRejectedValue(new Error("ECONNRESET"));

    await expect(generatePlan(input)).rejects.toThrow("ECONNRESET");
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
  });
});
