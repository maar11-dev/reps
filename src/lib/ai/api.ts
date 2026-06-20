import type { Exercise, GeneratePlanInput, SwapExerciseInput, WorkoutPlan } from "@/lib/ai/schema";

/**
 * Client-safe helper for calling the generation endpoint. Isomorphic (uses
 * `fetch`), imports only TYPES from the schema — never the server-only
 * `generate.ts`. This is the only bridge the client uses to reach the model.
 */

export interface ApiError {
  error: string;
  issues?: { path: string; message: string }[];
}

export class GeneratePlanError extends Error {
  readonly issues?: { path: string; message: string }[];
  constructor(message: string, issues?: { path: string; message: string }[]) {
    super(message);
    this.name = "GeneratePlanError";
    this.issues = issues;
  }
}

export async function requestPlan(
  input: GeneratePlanInput,
  signal?: AbortSignal,
): Promise<WorkoutPlan> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok) {
    let payload: ApiError | null = null;
    try {
      payload = (await res.json()) as ApiError;
    } catch {
      // fall through to generic message
    }
    throw new GeneratePlanError(
      payload?.error ?? `Request failed (${res.status}).`,
      payload?.issues,
    );
  }

  return (await res.json()) as WorkoutPlan;
}

export async function requestSwap(
  input: SwapExerciseInput,
  signal?: AbortSignal,
): Promise<Exercise> {
  const res = await fetch("/api/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok) {
    let payload: ApiError | null = null;
    try {
      payload = (await res.json()) as ApiError;
    } catch {
      // fall through to generic message
    }
    throw new GeneratePlanError(
      payload?.error ?? `Request failed (${res.status}).`,
      payload?.issues,
    );
  }

  return (await res.json()) as Exercise;
}
