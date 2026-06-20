import "server-only";

import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
import { getGroqModelId, getOpenAiModelId, shouldUseMock } from "@/lib/ai/config";
import { type ExerciseTemplate, isAvailable, LIBRARY, pickEquipment } from "@/lib/ai/library";
import { buildSwapPrompt, SWAP_SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { type Exercise, exerciseSchema, type SwapExerciseInput } from "@/lib/ai/schema";

/**
 * Swap one exercise for an equivalent (SERVER-ONLY).
 *
 * Reuses the exact same mock-first switch and provider selection as
 * `generate.ts`, and — crucially — reuses `exerciseSchema` as the structured
 * output, so a swapped exercise is byte-for-byte the same shape the plan already
 * renders. Mock mode resolves an equivalent from the shared `library.ts`.
 */
function getModel(): LanguageModel {
  if (process.env.GROQ_API_KEY) return groq(getGroqModelId());
  return openai(getOpenAiModelId());
}

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * Deterministic mock swap: pick a different exercise that shares a target muscle
 * with the current one and is doable with the available equipment, preferring the
 * same movement pattern. Mirrors the rules in `SWAP_SYSTEM_PROMPT`.
 */
export function mockSwap(input: SwapExerciseInput): Exercise {
  const { current, availableEquipment, avoid = [] } = input;
  const blocked = new Set([current.name, ...avoid].map(normalize));
  const currentMuscles = new Set(current.targetMuscles.map(normalize));

  const sharesMuscle = (t: ExerciseTemplate) =>
    t.targetMuscles.some((m) => currentMuscles.has(normalize(m)));

  // The template the current exercise came from (if any), used to prefer the
  // same movement pattern among the muscle-sharing candidates.
  const origin = LIBRARY.find((t) => normalize(t.name) === normalize(current.name));

  const sharing = LIBRARY.filter(
    (t) => !blocked.has(normalize(t.name)) && isAvailable(t, availableEquipment) && sharesMuscle(t),
  );
  const samePattern = origin ? sharing.filter((t) => t.pattern === origin.pattern) : [];
  const choice = samePattern[0] ?? sharing[0];

  // No equivalent available with this equipment — keep the current exercise.
  if (!choice) return current;

  return {
    name: choice.name,
    targetMuscles: choice.targetMuscles,
    sets: current.sets,
    reps: current.reps,
    restSeconds: current.restSeconds,
    equipment: pickEquipment(choice, availableEquipment),
    tempo: current.tempo,
    rpe: current.rpe,
    cue: choice.cue,
  };
}

export async function swapExercise(input: SwapExerciseInput): Promise<Exercise> {
  if (shouldUseMock()) {
    return mockSwap(input);
  }

  const { object } = await generateObject({
    model: getModel(),
    schema: exerciseSchema,
    system: SWAP_SYSTEM_PROMPT,
    prompt: buildSwapPrompt(input),
    maxOutputTokens: 600,
    temperature: 0.5,
  });

  return exerciseSchema.parse(object);
}
