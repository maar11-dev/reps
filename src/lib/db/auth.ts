import "server-only";

import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/db/supabase";

/**
 * Auth plumbing (SERVER-ONLY).
 *
 * Resolves the current user id from the Supabase session. When Supabase is not
 * configured (local/mock mode), it returns a stable stub id so the save/load flow
 * is fully exercisable without accounts. The sign-in UI is a later milestone; the
 * routes below already gate on this so wiring it up later is the only change.
 */

/** Stable stub user for local/mock mode (no Supabase configured). */
export const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return DEV_USER_ID;

  const client = await createSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}
