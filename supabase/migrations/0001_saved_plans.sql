-- Reps — saved plans (milestone 2: persistence + auth)
--
-- One row per plan a user has saved. The full, schema-valid WorkoutPlan is kept
-- verbatim in `plan` (jsonb); the flat columns are denormalised copies used for
-- cheap listing/filtering. Row Level Security scopes every operation to the
-- owning user so the anon key is safe to use from the server with the user's JWT.

create extension if not exists "pgcrypto";

create table if not exists public.saved_plans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  title            text not null,
  goal             text not null,
  experience_level text not null,
  days_per_week    integer not null check (days_per_week between 1 and 7),
  plan             jsonb not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Table-level privileges. A table created via raw SQL (not the dashboard Table
-- Editor) does NOT auto-grant the API roles, so grant `authenticated` explicitly.
-- RLS below still restricts every row to its owner; `anon` needs no access since
-- saving/listing requires a logged-in user.
grant select, insert, update, delete on table public.saved_plans to authenticated;

-- Listing is always "my plans, newest first".
create index if not exists saved_plans_user_created_idx
  on public.saved_plans (user_id, created_at desc);

-- Keep updated_at honest on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_plans_set_updated_at on public.saved_plans;
create trigger saved_plans_set_updated_at
  before update on public.saved_plans
  for each row execute function public.set_updated_at();

-- RLS: a user can only ever see or touch their own rows.
alter table public.saved_plans enable row level security;

drop policy if exists saved_plans_select_own on public.saved_plans;
create policy saved_plans_select_own on public.saved_plans
  for select using (auth.uid() = user_id);

drop policy if exists saved_plans_insert_own on public.saved_plans;
create policy saved_plans_insert_own on public.saved_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists saved_plans_update_own on public.saved_plans;
create policy saved_plans_update_own on public.saved_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists saved_plans_delete_own on public.saved_plans;
create policy saved_plans_delete_own on public.saved_plans
  for delete using (auth.uid() = user_id);
