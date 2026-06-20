import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client for the auth UI (sign-in/up forms, the header
 * session state). Isomorphic-safe to import, but only meaningful in the browser.
 *
 * It reads the public `NEXT_PUBLIC_*` env vars, which Next inlines into the
 * client bundle — the anon key is public by design (RLS protects the data), so
 * nothing secret ships here. The privileged, cookie-bound server client stays in
 * `supabase.ts` (`server-only`).
 */

/** True when both public Supabase vars are present (otherwise auth UI is hidden). */
export function isSupabaseConfiguredBrowser(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let client: SupabaseClient | undefined;

/**
 * Singleton browser client. Throws if called when Supabase isn't configured —
 * callers gate on {@link isSupabaseConfiguredBrowser} first.
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase is not configured.");
  client ??= createBrowserClient(url, anonKey);
  return client;
}
