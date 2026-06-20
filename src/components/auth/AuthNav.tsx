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
export function AuthNav() {
  const router = useRouter();
  const configured = isSupabaseConfiguredBrowser();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  async function handleSignOut() {
    await createBrowserSupabaseClient().auth.signOut();
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  // Hidden in dev/mock mode, and until the first session check resolves (no flicker).
  if (!configured || !ready) return null;

  if (!email) {
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
        title={email}
        className="hidden max-w-[12rem] truncate font-mono text-xs text-bone-dim sm:inline"
      >
        {email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-[var(--radius-sharp)] border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-bone-dim transition-colors hover:border-volt hover:text-volt"
      >
        Sign out
      </button>
    </div>
  );
}
