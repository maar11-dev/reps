# db

Persistence for saved plans (milestone 2). Layered so the logic is testable
without a live database:

- `types.ts` — `savedPlanSchema` (reuses `workoutPlanSchema`) + the `PlansRepository`
  transport interface. Isomorphic.
- `plans.ts` — repository-agnostic **service**: Zod-validates in and out, enforces
  ownership by `userId`. This is what the unit tests exercise.
- `memory.ts` — `InMemoryPlansRepository`: the test double **and** the local-dev
  fallback when Supabase env vars are absent.
- `supabase.ts` — `server-only`. Cookie-bound Supabase client (anon key + the
  user's session, so **RLS** is the authority), `SupabasePlansRepository`, and
  `getPlansRepository()` which picks Supabase vs memory (mirrors `shouldUseMock`).
- `auth.ts` — `server-only`. `getCurrentUserId()`; returns `DEV_USER_ID` in
  local/mock mode. The sign-in UI is a later milestone.

Schema migration: `supabase/migrations/0001_saved_plans.sql` (RLS enabled).
Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`).
