/**
 * AI generation configuration + the mock toggle.
 *
 * Isomorphic on purpose (no `server-only`) so it can be unit-tested without a
 * DOM/server harness, but in practice these env vars are only read on the
 * server. The functions read `process.env` lazily so tests can override it.
 */

/** Is any live provider key configured? */
export function hasLiveProviderKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
}

/**
 * Whether `/api/generate` should return a deterministic MOCK plan instead of
 * calling a real LLM.
 *
 * Returns true when EITHER:
 *  - `REPS_USE_MOCK === "true"` (explicit opt-in, the default in .env.example), OR
 *  - there is no live provider key (can't make a real call anyway).
 *
 * To go live: set `REPS_USE_MOCK=false` AND provide a provider key
 * (`GROQ_API_KEY` is preferred; `OPENAI_API_KEY` also works).
 */
export function shouldUseMock(): boolean {
  if (process.env.REPS_USE_MOCK === "true") return true;
  if (process.env.REPS_USE_MOCK === "false") return !hasLiveProviderKey();
  // Unset: fall back to "mock unless a key is present".
  return !hasLiveProviderKey();
}

/**
 * Default model ids per provider, overridable via env.
 *
 * The Groq default must be one of Groq's structured-output (`json_schema`)
 * models — `generateObject` relies on it. See
 * https://console.groq.com/docs/structured-outputs#supported-models
 */
export function getGroqModelId(): string {
  return process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
}

export function getOpenAiModelId(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}
