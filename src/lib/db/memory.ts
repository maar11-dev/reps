import type { WorkoutPlan } from "@/lib/ai/schema";
import type { NewSavedPlan, PlansRepository, SavedPlan } from "@/lib/db/types";

/**
 * In-memory implementation of {@link PlansRepository}.
 *
 * Two jobs:
 *  - the default unit-test double for the plans service (no network, deterministic);
 *  - the local-dev fallback when Supabase env vars are absent, so the save/load
 *    flow works end-to-end in mock mode (mirrors the AI `shouldUseMock` pattern).
 *
 * Isomorphic (no `server-only`). State lives in a module-less instance so each
 * `new InMemoryPlansRepository()` is isolated — tests get a clean store.
 */
export class InMemoryPlansRepository implements PlansRepository {
  private readonly rows = new Map<string, SavedPlan>();

  private newId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `mem_${Date.now()}_${this.rows.size}`;
  }

  async insert(input: NewSavedPlan): Promise<SavedPlan> {
    const now = new Date().toISOString();
    const row: SavedPlan = {
      id: this.newId(),
      userId: input.userId,
      title: input.title,
      goal: input.goal,
      experienceLevel: input.experienceLevel,
      daysPerWeek: input.daysPerWeek,
      plan: input.plan,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(row.id, row);
    return row;
  }

  async listByUser(userId: string): Promise<SavedPlan[]> {
    // Reverse first so that rows sharing a createdAt (same-millisecond inserts)
    // keep newest-first order; the stable sort then orders by timestamp.
    return [...this.rows.values()]
      .reverse()
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById(userId: string, id: string): Promise<SavedPlan | null> {
    const row = this.rows.get(id);
    return row && row.userId === userId ? row : null;
  }

  async updatePlan(userId: string, id: string, plan: WorkoutPlan): Promise<SavedPlan | null> {
    const row = this.rows.get(id);
    if (!row || row.userId !== userId) return null;
    const updated: SavedPlan = {
      ...row,
      plan,
      title: plan.title,
      goal: plan.goal,
      experienceLevel: plan.experienceLevel,
      daysPerWeek: plan.daysPerWeek,
      updatedAt: new Date().toISOString(),
    };
    this.rows.set(id, updated);
    return updated;
  }

  async deleteById(userId: string, id: string): Promise<boolean> {
    const row = this.rows.get(id);
    if (!row || row.userId !== userId) return false;
    return this.rows.delete(id);
  }
}
