import "server-only";

import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
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
 */
export async function generatePlan(input: GeneratePlanInput): Promise<WorkoutPlan> {
  if (shouldUseMock()) {
    return mockPlan(input);
  }

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
