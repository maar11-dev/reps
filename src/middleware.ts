import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isProtectedPath, SIGN_IN_PATH } from "@/lib/auth/routes";

/**
 * Refreshes the Supabase auth session cookie on every request (required by
 * `@supabase/ssr`) and protects authed routes. When Supabase isn't configured we
 * do nothing — the app runs in dev/mock mode with `DEV_USER_ID`.
 *
 * Only `/plans` (the saved-plan library) is gated; `/build` stays public so plans
 * can be generated without an account. See `src/lib/auth/routes.ts`.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: getUser() (not getSession) revalidates the token and writes the
  // refreshed cookie via setAll above. Do not run code between this and the return.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = SIGN_IN_PATH;
    signInUrl.search = "";
    signInUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
