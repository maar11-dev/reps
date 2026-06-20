import "server-only";

import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/db/supabase";

/**
 * Auth plumbing (SERVER-ONLY).
 *
 * Resolves the current user id from the Supabase session. When Supabase is NOT
 * configured we fall back to a stub id — but only in development, so the local
 * save/load flow works without accounts. In production the fallback is disabled:
 * no Supabase (or no session) means no user, so persistence requires a real login.
 */

/** Stable stub user for local dev only (no Supabase configured). */
export const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return process.env.NODE_ENV === "production" ? null : DEV_USER_ID;
  }

  // Resolve the session defensively: a misconfigured/unreachable Supabase must
  // surface as "not authenticated" (a clean 401), never as an unhandled 500.
  try {
    const client = await createSupabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    return user?.id ?? null;
  } catch (error) {
    console.error("[auth] could not resolve the current user:", error);
    return null;
  }
}
