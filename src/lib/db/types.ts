import { z } from "zod";
import { goalSchema, levelSchema, type WorkoutPlan, workoutPlanSchema } from "@/lib/ai/schema";

/**
 * Persistence types for saved plans.
 *
 * Isomorphic on purpose (no `server-only`) so the service logic and its tests can
 * run without a server/DB harness. The row reuses `workoutPlanSchema` for the
 * `plan` field — the AI contract stays the single source of truth on the way in
 * AND out of the database (see CLAUDE.md, "The AI Contract").
 */

export const savedPlanSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string(),
  goal: goalSchema,
  experienceLevel: levelSchema,
  daysPerWeek: z.number().int().min(1).max(7),
  plan: workoutPlanSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedPlan = z.infer<typeof savedPlanSchema>;

/** A plan to persist, before the store assigns an id and timestamps. */
export interface NewSavedPlan {
  userId: string;
  title: string;
  goal: WorkoutPlan["goal"];
  experienceLevel: WorkoutPlan["experienceLevel"];
  daysPerWeek: number;
  plan: WorkoutPlan;
}

/**
 * Narrow transport interface over the saved_plans store. Keeping it to primitive
 * argument shapes (not Supabase's chained query builder) is what lets the service
 * logic be unit-tested against an in-memory implementation while the Supabase one
 * does the real chaining. Every method is already scoped to `userId` so ownership
 * is enforced both here AND by Postgres RLS.
 */
export interface PlansRepository {
  insert(input: NewSavedPlan): Promise<SavedPlan>;
  listByUser(userId: string): Promise<SavedPlan[]>;
  getById(userId: string, id: string): Promise<SavedPlan | null>;
  updatePlan(userId: string, id: string, plan: WorkoutPlan): Promise<SavedPlan | null>;
  deleteById(userId: string, id: string): Promise<boolean>;
}
