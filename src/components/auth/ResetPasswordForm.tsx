"use client";

import { type FormEvent, useId, useState } from "react";
import { authInputClass } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";
import { createBrowserSupabaseClient } from "@/lib/db/supabase-browser";

/**
 * Sets a new password. Reached from the reset email after `/auth/callback` has
 * established the recovery session, so `updateUser` runs against an active
 * session. Without one (link expired / opened directly) it surfaces the error.
 */
export function ResetPasswordForm() {
  const passwordId = useId();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      window.location.assign(DEFAULT_SIGNED_IN_PATH);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't update your password. Use the link from your email again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Field label="New password" htmlFor={passwordId}>
        <input
          id={passwordId}
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
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

      <Button
        type="submit"
        disabled={isSubmitting || done}
        aria-busy={isSubmitting}
        className="text-base"
      >
        {isSubmitting ? "Updating…" : done ? "Updated ✓" : "Update password"}
      </Button>
    </form>
  );
}
