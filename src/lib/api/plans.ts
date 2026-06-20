import type { WorkoutPlan } from "@/lib/ai/schema";
import type { SavedPlan } from "@/lib/db/types";

/**
 * Client-safe bridge to the /api/plans routes. Isomorphic (`fetch`), imports only
 * TYPES from the server modules — never the server-only DB code. This is the only
 * way the client touches persistence.
 */

export class PlansApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PlansApiError";
    this.status = status;
  }
}

async function errorFrom(res: Response): Promise<PlansApiError> {
  let message = `Request failed (${res.status}).`;
  try {
    const payload = (await res.json()) as { error?: string };
    if (payload?.error) message = payload.error;
  } catch {
    // keep the generic message
  }
  return new PlansApiError(message, res.status);
}

export async function listSavedPlans(signal?: AbortSignal): Promise<SavedPlan[]> {
  const res = await fetch("/api/plans", { signal });
  if (!res.ok) throw await errorFrom(res);
  const { plans } = (await res.json()) as { plans: SavedPlan[] };
  return plans;
}

export async function saveCurrentPlan(plan: WorkoutPlan, signal?: AbortSignal): Promise<SavedPlan> {
  const res = await fetch("/api/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
    signal,
  });
  if (!res.ok) throw await errorFrom(res);
  const { plan: saved } = (await res.json()) as { plan: SavedPlan };
  return saved;
}

export async function updateSavedPlan(
  id: string,
  plan: WorkoutPlan,
  signal?: AbortSignal,
): Promise<SavedPlan> {
  const res = await fetch(`/api/plans/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
    signal,
  });
  if (!res.ok) throw await errorFrom(res);
  const { plan: saved } = (await res.json()) as { plan: SavedPlan };
  return saved;
}

export async function deleteSavedPlan(id: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`/api/plans/${id}`, { method: "DELETE", signal });
  if (!res.ok) throw await errorFrom(res);
}
