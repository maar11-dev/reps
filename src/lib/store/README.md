# store

Zustand client state (milestone 2). `plans-store.ts`:

- `savedPlans` — the user's persisted library, hydrated from `/api/plans`.
- `draft` + `isDirty` — the plan currently on screen and whether in-session edits
  (exercise swaps) diverge from what was saved.

In-session edits live only in memory; the durable copy is the database. The store
holds no credentials. It is usable without React (`usePlansStore.getState()` /
`.setState()`), which is how the unit tests drive it.

Key action: `swapExerciseInDraft(dayNumber, exerciseIndex, next)` immutably
replaces one exercise and marks the draft dirty.
