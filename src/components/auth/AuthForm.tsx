"use client";

import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import { authInputClass } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import {
  AUTH_CALLBACK_PATH,
  DEFAULT_SIGNED_IN_PATH,
  FORGOT_PASSWORD_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  safeRedirectTo,
} from "@/lib/auth/routes";
import { createBrowserSupabaseClient } from "@/lib/db/supabase-browser";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  redirectTo?: string | null;
}

/**
 * Email + password sign-in / sign-up form (Supabase Auth, browser client).
 * On success it navigates to the sanitized `redirectTo` (or the saved-plans
 * library). A sign-up that needs email confirmation shows a "check your inbox"
 * state instead of redirecting.
 */
export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const isSignUp = mode === "sign-up";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const dest = safeRedirectTo(redirectTo) ?? DEFAULT_SIGNED_IN_PATH;
  const destQuery = `?redirectTo=${encodeURIComponent(dest)}`;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      if (isSignUp) {
        const emailRedirectTo = `${window.location.origin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(dest)}`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo, data: { display_name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        // A session means confirmation is off — we're in. Otherwise prompt for it.
        if (data.session) {
          // Full navigation so the session cookie is sent and the server renders
          // the destination — avoids a client-nav race with the auth middleware.
          window.location.assign(dest);
        } else {
          setCheckEmail(true);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.assign(dest);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (checkEmail) {
    return (
      <div
        role="status"
        className="rise flex flex-col gap-3 rounded-[var(--radius-sharp)] border-2 border-volt bg-volt/[0.04] p-6"
      >
        <p className="kicker text-volt">Almost there</p>
        <p className="text-bone">
          We sent a confirmation link to <span className="text-volt">{email}</span>. Click it to
          activate your account, then sign in.
        </p>
        <Link
          href={`${SIGN_IN_PATH}${destQuery}`}
          className="font-mono text-xs uppercase tracking-widest text-bone-dim hover:text-volt"
        >
          Back to sign in →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {isSignUp ? (
        <Field label="Name" htmlFor={nameId}>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
            className={authInputClass}
          />
        </Field>
      ) : null}

      <Field label="Email" htmlFor={emailId}>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={authInputClass}
        />
      </Field>

      <Field label="Password" htmlFor={passwordId}>
        <input
          id={passwordId}
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isSignUp ? "At least 6 characters" : "••••••••"}
          className={authInputClass}
        />
      </Field>

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-sharp)] border-2 border-danger bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="text-base">
        {isSubmitting
          ? isSignUp
            ? "Creating account…"
            : "Signing in…"
          : isSignUp
            ? "Create account"
            : "Sign in"}
      </Button>

      <div className="flex flex-col gap-2 text-sm text-bone-dim">
        {isSignUp ? (
          <p>
            Already have an account?{" "}
            <Link href={`${SIGN_IN_PATH}${destQuery}`} className="text-volt hover:underline">
              Sign in
            </Link>
          </p>
        ) : (
          <>
            <p>
              New here?{" "}
              <Link href={`${SIGN_UP_PATH}${destQuery}`} className="text-volt hover:underline">
                Create an account
              </Link>
            </p>
            <Link href={FORGOT_PASSWORD_PATH} className="text-bone-dim hover:text-volt">
              Forgot your password?
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
