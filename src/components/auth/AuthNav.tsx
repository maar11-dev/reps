"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SIGN_IN_PATH } from "@/lib/auth/routes";
import {
  createBrowserSupabaseClient,
  isSupabaseConfiguredBrowser,
} from "@/lib/db/supabase-browser";

/**
 * Header session island. Shows the signed-in user's email + a sign-out button,
 * or a "Sign in" link otherwise. Subscribes to auth changes so it stays in sync
 * after login/logout without a full reload. Renders nothing when Supabase isn't
 * configured (dev/mock mode), where there's no real session.
 */
interface Account {
  /** Display name if set at sign-up, otherwise the email. */
  label: string;
  email: string;
}

/** Prefer the user's chosen display name, falling back to their email. */
function toAccount(
  user: { email?: string; user_metadata?: Record<string, unknown> } | null,
): Account | null {
  if (!user) return null;
  const email = user.email ?? "";
  const name =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "";
  return { label: name || email, email };
}

export function AuthNav() {
  const router = useRouter();
  const configured = isSupabaseConfiguredBrowser();
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data }) => {
      setAccount(toAccount(data.user));
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount(toAccount(session?.user ?? null));
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  async function handleSignOut() {
    await createBrowserSupabaseClient().auth.signOut();
    setAccount(null);
    router.push("/");
    router.refresh();
  }

  // Hidden in dev/mock mode, and until the first session check resolves (no flicker).
  if (!configured || !ready) return null;

  if (!account) {
    return (
      <Link
        href={SIGN_IN_PATH}
        className="font-mono text-xs uppercase tracking-widest text-bone-dim transition-colors hover:text-volt"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span
        title={account.email}
        className="hidden max-w-[12rem] truncate border-2 border-line px-2 py-1 font-mono text-xs text-bone sm:inline"
      >
        {account.label}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="press border-2 border-line px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-bone-dim hover:border-volt hover:text-volt hover:shadow-[3px_3px_0_0_var(--color-volt)]"
      >
        Sign out
      </button>
    </div>
  );
}
