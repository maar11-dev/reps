import { type WorkoutPlan, workoutPlanSchema } from "@/lib/ai/schema";
import {
  type NewSavedPlan,
  type PlansRepository,
  type SavedPlan,
  savedPlanSchema,
} from "@/lib/db/types";

/**
 * Plans service — repository-agnostic business logic.
 *
 * Every function validates with Zod at both ends: the incoming `plan` against the
 * AI contract before it is stored, and the persisted row on the way back out (so
 * corrupt/legacy rows surface loudly instead of leaking an untyped object to the
 * UI). Ownership is carried as an explicit `userId` argument and enforced again by
 * the repository (and, for Supabase, by RLS). This module is what the unit tests
 * exercise against {@link InMemoryPlansRepository}.
 */

/** Derive the flat, denormalised columns from a validated plan. */
function toNewRow(userId: string, plan: WorkoutPlan): NewSavedPlan {
  return {
    userId,
    title: plan.title,
    goal: plan.goal,
    experienceLevel: plan.experienceLevel,
    daysPerWeek: plan.daysPerWeek,
    plan,
  };
}

export async function savePlan(
  repo: PlansRepository,
  userId: string,
  input: unknown,
): Promise<SavedPlan> {
  const plan = workoutPlanSchema.parse(input);
  const row = await repo.insert(toNewRow(userId, plan));
  return savedPlanSchema.parse(row);
}

export async function listPlans(repo: PlansRepository, userId: string): Promise<SavedPlan[]> {
  const rows = await repo.listByUser(userId);
  return rows.map((r) => savedPlanSchema.parse(r));
}

export async function getPlan(
  repo: PlansRepository,
  userId: string,
  id: string,
): Promise<SavedPlan | null> {
  const row = await repo.getById(userId, id);
  return row ? savedPlanSchema.parse(row) : null;
}

export async function updatePlan(
  repo: PlansRepository,
  userId: string,
  id: string,
  input: unknown,
): Promise<SavedPlan | null> {
  const plan = workoutPlanSchema.parse(input);
  const row = await repo.updatePlan(userId, id, plan);
  return row ? savedPlanSchema.parse(row) : null;
}

export async function deletePlan(
  repo: PlansRepository,
  userId: string,
  id: string,
): Promise<boolean> {
  return repo.deleteById(userId, id);
}
