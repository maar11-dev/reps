import { create } from "zustand";
import type { Exercise, WorkoutPlan } from "@/lib/ai/schema";
import type { SavedPlan } from "@/lib/db/types";

/**
 * Client state for milestone 2.
 *
 * Splits the two concerns the UI cares about:
 *  - `savedPlans`: the user's persisted library (hydrated from /api/plans);
 *  - `draft` + `draftSavedId` + `isDirty`: the plan currently on screen, the id of
 *    the saved row it came from (or `null` if never saved), and whether in-session
 *    edits (exercise swaps) diverge from what is persisted.
 *
 * `draftSavedId` is what lets the Save action choose POST (create) vs PUT (update):
 * a freshly generated plan has no id; one opened from the library does.
 *
 * In-session edits live only in memory — the durable copy is the database (the
 * source of truth, re-fetched into `savedPlans`). Nothing here ever holds
 * credentials. The store is usable without React
 * (`usePlansStore.getState()/.setState()`), which is how the unit tests drive it.
 */

export interface PlansState {
  savedPlans: SavedPlan[];
  draft: WorkoutPlan | null;
  /** Id of the saved row `draft` corresponds to, or `null` if not yet saved. */
  draftSavedId: string | null;
  /** True when `draft` has edits not yet persisted. */
  isDirty: boolean;

  setSavedPlans: (plans: SavedPlan[]) => void;
  addSavedPlan: (plan: SavedPlan) => void;
  removeSavedPlan: (id: string) => void;

  /** Load a freshly generated plan into the editor (unsaved, clean). */
  setDraft: (plan: WorkoutPlan | null) => void;
  /** Load a persisted plan into the editor (tracks its id, clean). */
  loadSavedPlan: (saved: SavedPlan) => void;
  /** Record a successful save: upsert into the library, track id, mark clean. */
  markSaved: (saved: SavedPlan) => void;
  resetDraft: () => void;

  /**
   * Replace one exercise in the draft, addressing the day by its 1-based
   * `dayNumber` and the exercise by array index. Immutable — the previous plan
   * object is never mutated — and marks the draft dirty.
   */
  swapExerciseInDraft: (dayNumber: number, exerciseIndex: number, next: Exercise) => void;
}

export const initialPlansState = {
  savedPlans: [] as SavedPlan[],
  draft: null as WorkoutPlan | null,
  draftSavedId: null as string | null,
  isDirty: false,
};

export const usePlansStore = create<PlansState>((set) => ({
  ...initialPlansState,

  setSavedPlans: (plans) => set({ savedPlans: plans }),

  addSavedPlan: (plan) =>
    set((state) => ({
      // De-dupe by id so re-saving replaces rather than appends.
      savedPlans: [plan, ...state.savedPlans.filter((p) => p.id !== plan.id)],
    })),

  removeSavedPlan: (id) =>
    set((state) => ({ savedPlans: state.savedPlans.filter((p) => p.id !== id) })),

  setDraft: (plan) => set({ draft: plan, draftSavedId: null, isDirty: false }),

  loadSavedPlan: (saved) => set({ draft: saved.plan, draftSavedId: saved.id, isDirty: false }),

  markSaved: (saved) =>
    set((state) => ({
      savedPlans: [saved, ...state.savedPlans.filter((p) => p.id !== saved.id)],
      draftSavedId: saved.id,
      isDirty: false,
    })),

  resetDraft: () => set({ draft: null, draftSavedId: null, isDirty: false }),

  swapExerciseInDraft: (dayNumber, exerciseIndex, next) =>
    set((state) => {
      if (!state.draft) return state;
      const days = state.draft.days.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        const exercises = day.exercises.map((ex, i) => (i === exerciseIndex ? next : ex));
        return { ...day, exercises };
      });
      return { draft: { ...state.draft, days }, isDirty: true };
    }),
}));
