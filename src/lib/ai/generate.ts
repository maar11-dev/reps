import "server-only";

import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { generateObject, type LanguageModel, NoObjectGeneratedError } from "ai";
import { getGroqModelId, getOpenAiModelId, shouldUseMock } from "@/lib/ai/config";
import { mockPlan } from "@/lib/ai/mock";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { type GeneratePlanInput, type WorkoutPlan, workoutPlanSchema } from "@/lib/ai/schema";

/**
 * Pick the live model. Groq is preferred when its key is present (fast + free
 * tier); OpenAI is the fallback. Provider keys are read here, server-side only.
 */
function getModel(): LanguageModel {
  if (process.env.GROQ_API_KEY) return groq(getGroqModelId());
  return openai(getOpenAiModelId());
}

/** How many times to ask the model before giving up on a valid object. */
const MAX_GENERATION_ATTEMPTS = 3;

/**
 * A workout plan is a large nested object, and models occasionally degrade
 * mid-generation — e.g. flattening a day's `{key: value}` pairs into sibling
 * tokens, which parses as JSON but fails the schema. That surfaces as
 * `NoObjectGeneratedError` (its `cause` is the Zod error). These are transient:
 * a re-roll at the same temperature almost always recovers, so we retry them.
 */
function isRetryableGenerationError(error: unknown): boolean {
  if (NoObjectGeneratedError.isInstance(error)) return true;
  // Defensive name checks in case the SDK error isn't recognised by `isInstance`
  // (version skew) or our own post-parse `.parse` throws.
  if (error instanceof Error && error.name === "AI_NoObjectGeneratedError") return true;
  if (error instanceof Error && error.name === "ZodError") return true;
  return false;
}

async function generatePlanOnce(input: GeneratePlanInput): Promise<WorkoutPlan> {
  const { object } = await generateObject({
    model: getModel(),
    schema: workoutPlanSchema,
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(input),
    // A full week of exercises + rationale + progression is a long object; give
    // the model room so the JSON is never truncated mid-structure. Capped to fit
    // Groq's free-tier 8k tokens/minute budget (input + output).
    maxOutputTokens: 6000,
    temperature: 0.6,
  });

  // `generateObject` already validates against the schema, but parse once more
  // so the return type is the exact inferred type and any drift is caught here.
  return workoutPlanSchema.parse(object);
}

/**
 * Generate a workout plan from validated input.
 *
 * SERVER-ONLY. The `import "server-only"` above makes the build fail if a client
 * component ever imports this module — that is the guard that keeps the provider
 * key (read only here) off the client.
 *
 * Mock-first: when {@link shouldUseMock} is true we return a deterministic plan
 * and never touch the network. Flipping `REPS_USE_MOCK=false` (with a provider
 * key present) routes the exact same call shape through `generateObject` — the
 * one easy switch to go live.
 *
 * Live calls are retried up to {@link MAX_GENERATION_ATTEMPTS} times on transient
 * schema failures (see {@link isRetryableGenerationError}); the last error is
 * rethrown so the route can return its typed 500.
 */
export async function generatePlan(input: GeneratePlanInput): Promise<WorkoutPlan> {
  if (shouldUseMock()) {
    return mockPlan(input);
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      return await generatePlanOnce(input);
    } catch (error) {
      lastError = error;
      if (!isRetryableGenerationError(error) || attempt === MAX_GENERATION_ATTEMPTS) break;
      console.warn(
        `[generatePlan] attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} produced an invalid plan; retrying.`,
      );
    }
  }
  throw lastError;
}
