"use client";

import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import { authInputClass } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { AUTH_CALLBACK_PATH, RESET_PASSWORD_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";
import { createBrowserSupabaseClient } from "@/lib/db/supabase-browser";

/**
 * Requests a password-reset email. The link routes through `/auth/callback`
 * (which exchanges the code for a session) and lands on `/reset-password`, where
 * the user sets a new password.
 */
export function ForgotPasswordForm() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(RESET_PASSWORD_PATH)}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-[var(--radius-sharp)] border-2 border-volt bg-volt/[0.04] p-6"
      >
        <p className="kicker text-volt">Check your inbox</p>
        <p className="text-bone">
          If an account exists for <span className="text-volt">{email}</span>, we sent a link to
          reset your password.
        </p>
        <Link
          href={SIGN_IN_PATH}
          className="font-mono text-xs uppercase tracking-widest text-bone-dim hover:text-volt"
        >
          Back to sign in →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
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

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-sharp)] border-2 border-danger bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="text-base">
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>

      <Link href={SIGN_IN_PATH} className="text-sm text-bone-dim hover:text-volt">
        ← Back to sign in
      </Link>
    </form>
  );
}
