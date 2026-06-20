import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_SIGNED_IN_PATH, SIGN_IN_PATH, safeRedirectTo } from "@/lib/auth/routes";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /auth/callback
 *
 * Exchanges the `code` from an email link (sign-up confirmation or password
 * recovery) for a session cookie, then redirects to the sanitized `next` target.
 * On any failure it sends the user to sign-in with an error flag.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectTo(searchParams.get("next")) ?? DEFAULT_SIGNED_IN_PATH;

  if (code && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error("[/auth/callback] code exchange failed:", error.message);
  }

  return NextResponse.redirect(new URL(`${SIGN_IN_PATH}?error=auth`, origin));
}
