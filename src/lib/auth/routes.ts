/**
 * Pure auth-routing helpers, shared by the middleware and the client. No I/O, so
 * they're trivially unit-testable.
 */

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const RESET_PASSWORD_PATH = "/reset-password";
export const AUTH_CALLBACK_PATH = "/auth/callback";

/** Where to land after signing in when no explicit target is given (the home screen). */
export const DEFAULT_SIGNED_IN_PATH = "/";

/**
 * Route prefixes that require an authenticated user. Generating a plan (`/build`)
 * is intentionally public — only persistence (`/plans`, saving) needs an account.
 */
export const PROTECTED_PREFIXES = ["/plans"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Sanitize a post-login redirect target. Only internal, single-slash absolute
 * paths are allowed — rejects `//host`, `https://…`, and anything not starting
 * with `/` to prevent open-redirect abuse. Returns `null` when unsafe/empty.
 */
export function safeRedirectTo(target: string | null | undefined): string | null {
  if (!target) return null;
  if (!target.startsWith("/")) return null;
  if (target.startsWith("//")) return null;
  return target;
}
