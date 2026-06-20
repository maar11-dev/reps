"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlansApiError, saveCurrentPlan, updateSavedPlan } from "@/lib/api/plans";
import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { usePlansStore } from "@/lib/store/plans-store";

/**
 * Persist the current draft. Chooses the verb from store state:
 *  - no `draftSavedId`  → POST (create a new saved plan);
 *  - has id + `isDirty` → PUT  (persist in-session edits, e.g. an exercise swap);
 *  - has id + clean     → nothing to do (button shows "Saved", disabled).
 *
 * Status is announced via an `aria-live` region so screen readers hear the
 * outcome; errors surface in an `alert`. Renders nothing without a draft.
 */
export function SavePlanButton() {
  const router = useRouter();
  const draft = usePlansStore((s) => s.draft);
  const draftSavedId = usePlansStore((s) => s.draftSavedId);
  const isDirty = usePlansStore((s) => s.isDirty);
  const markSaved = usePlansStore((s) => s.markSaved);

  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!draft) return null;

  const isNew = draftSavedId === null;
  const canSave = isNew || isDirty;
  const label = isSaving ? "Saving…" : isNew ? "Save plan" : isDirty ? "Save changes" : "Saved ✓";

  async function handleSave() {
    if (!draft || isSaving) return;
    setIsSaving(true);
    setError(null);
    setJustSaved(false);
    try {
      const saved = draftSavedId
        ? await updateSavedPlan(draftSavedId, draft)
        : await saveCurrentPlan(draft);
      markSaved(saved);
      setJustSaved(true);
    } catch (err) {
      // No session → send the user to sign in, then back to the builder to retry.
      if (err instanceof PlansApiError && err.status === 401) {
        router.push(`${SIGN_IN_PATH}?redirectTo=/build`);
        return;
      }
      setError(err instanceof PlansApiError ? err.message : "Couldn't save your plan. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="primary"
        onClick={handleSave}
        disabled={isSaving || !canSave}
        aria-busy={isSaving}
      >
        {label}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {justSaved && !isDirty ? "Plan saved." : ""}
      </span>
      {error ? (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
