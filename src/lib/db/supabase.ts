import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { WorkoutPlan } from "@/lib/ai/schema";
import { InMemoryPlansRepository } from "@/lib/db/memory";
import type { NewSavedPlan, PlansRepository, SavedPlan } from "@/lib/db/types";

/**
 * SERVER-ONLY. Holds the Supabase wiring and the real repository.
 *
 * We deliberately use the **anon key + the user's session** (never the service
 * role key), so Postgres RLS — not application code — is the final authority on
 * who can read or write a row. The anon key is public by design; the row-level
 * policies are what protect the data (see CLAUDE.md: never expose secrets, all
 * privileged access stays server-side).
 */

/** True when both Supabase env vars are present (otherwise we fall back to memory). */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Create a request-scoped Supabase client bound to the caller's auth cookies. */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase is not configured.");

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` was called from a Server Component where cookies are
          // read-only. Safe to ignore: session refresh is handled elsewhere.
        }
      },
    },
  });
}

interface SavedPlanRow {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  experience_level: string;
  days_per_week: number;
  plan: unknown;
  created_at: string;
  updated_at: string;
}

/** Map a DB row (snake_case, untyped jsonb) to the app's camelCase shape. */
function fromRow(row: SavedPlanRow): SavedPlan {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    goal: row.goal as SavedPlan["goal"],
    experienceLevel: row.experience_level as SavedPlan["experienceLevel"],
    daysPerWeek: row.days_per_week,
    plan: row.plan as WorkoutPlan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TABLE = "saved_plans";

export class SupabasePlansRepository implements PlansRepository {
  constructor(private readonly client: SupabaseClient) {}

  async insert(input: NewSavedPlan): Promise<SavedPlan> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        user_id: input.userId,
        title: input.title,
        goal: input.goal,
        experience_level: input.experienceLevel,
        days_per_week: input.daysPerWeek,
        plan: input.plan,
      })
      .select()
      .single();
    if (error) throw new Error(`saved_plans insert failed: ${error.message}`);
    return fromRow(data as SavedPlanRow);
  }

  async listByUser(userId: string): Promise<SavedPlan[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`saved_plans list failed: ${error.message}`);
    return (data as SavedPlanRow[]).map(fromRow);
  }

  async getById(userId: string, id: string): Promise<SavedPlan | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select()
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`saved_plans get failed: ${error.message}`);
    return data ? fromRow(data as SavedPlanRow) : null;
  }

  async updatePlan(userId: string, id: string, plan: WorkoutPlan): Promise<SavedPlan | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .update({
        plan,
        title: plan.title,
        goal: plan.goal,
        experience_level: plan.experienceLevel,
        days_per_week: plan.daysPerWeek,
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`saved_plans update failed: ${error.message}`);
    return data ? fromRow(data as SavedPlanRow) : null;
  }

  async deleteById(userId: string, id: string): Promise<boolean> {
    const { data, error } = await this.client
      .from(TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("id", id)
      .select("id");
    if (error) throw new Error(`saved_plans delete failed: ${error.message}`);
    return Array.isArray(data) && data.length > 0;
  }
}

/**
 * Process-wide in-memory fallback for local/mock mode. Stashed on `globalThis`
 * so it survives Next's dev HMR (module reloads) and persists across requests
 * within a single `pnpm dev` session.
 */
const globalForDb = globalThis as unknown as { __repsPlansRepo?: InMemoryPlansRepository };

/**
 * Resolve the repository to use: the real Supabase one (cookie-bound, RLS-scoped)
 * when configured, otherwise a shared in-memory store. Mirrors the AI layer's
 * `shouldUseMock` switch so the whole app runs without external services.
 */
export async function getPlansRepository(): Promise<PlansRepository> {
  if (isSupabaseConfigured()) {
    const client = await createSupabaseServerClient();
    return new SupabasePlansRepository(client);
  }
  globalForDb.__repsPlansRepo ??= new InMemoryPlansRepository();
  return globalForDb.__repsPlansRepo;
}
