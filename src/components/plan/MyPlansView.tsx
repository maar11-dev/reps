"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/ai/labels";
import { deleteSavedPlan, listSavedPlans, PlansApiError } from "@/lib/api/plans";
import type { SavedPlan } from "@/lib/db/types";
import { usePlansStore } from "@/lib/store/plans-store";
import { cn } from "@/lib/utils";

/**
 * The saved-plan library. Fetches the current user's plans on mount, and lets
 * them open one (handed back via `onOpen`, which the page wires to navigation)
 * or delete one behind an inline confirmation step.
 *
 * The list lives in the store so a save elsewhere stays in sync; this view just
 * hydrates it and renders. Loading / empty / error states are all surfaced.
 */
interface MyPlansViewProps {
  onOpen: (plan: SavedPlan) => void;
}

type LoadState = "loading" | "ready" | "error";

/** Literal stagger delays (Tailwind JIT needs them spelled out, not interpolated). */
const STAGGER = [
  "[animation-delay:0ms]",
  "[animation-delay:70ms]",
  "[animation-delay:140ms]",
  "[animation-delay:210ms]",
  "[animation-delay:280ms]",
  "[animation-delay:350ms]",
] as const;
const stagger = (i: number) => STAGGER[Math.min(i, STAGGER.length - 1)];

export function MyPlansView({ onOpen }: MyPlansViewProps) {
  const savedPlans = usePlansStore((s) => s.savedPlans);
  const setSavedPlans = usePlansStore((s) => s.setSavedPlans);
  const removeSavedPlan = usePlansStore((s) => s.removeSavedPlan);

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listSavedPlans(controller.signal)
      .then((plans) => {
        setSavedPlans(plans);
        setState("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof PlansApiError ? err.message : "Couldn't load your plans.");
        setState("error");
      });
    return () => controller.abort();
  }, [setSavedPlans]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteSavedPlan(id);
      removeSavedPlan(id);
      setConfirmingId(null);
    } catch (err) {
      setError(err instanceof PlansApiError ? err.message : "Couldn't delete that plan.");
    } finally {
      setDeletingId(null);
    }
  }

  if (state === "loading") {
    return (
      <p className="font-mono text-sm uppercase tracking-widest text-bone-dim">
        Loading your plans…
      </p>
    );
  }

  if (state === "error") {
    return (
      <p role="alert" className="text-sm text-danger">
        {error}
      </p>
    );
  }

  if (savedPlans.length === 0) {
    return (
      <div className="rise flex flex-col items-start gap-4 rounded-[var(--radius-sharp)] border-2 border-dashed border-line bg-surface/50 p-10">
        <p className="display text-2xl text-bone">You haven&apos;t saved any plans yet.</p>
        <Link
          href="/build"
          className="press inline-flex items-center border-2 border-volt-ink bg-volt px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-volt-ink shadow-[4px_4px_0_0_var(--color-bone)]"
        >
          Build your first plan →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {savedPlans.map((saved, i) => {
          const confirming = confirmingId === saved.id;
          const deleting = deletingId === saved.id;
          return (
            <li
              key={saved.id}
              className={cn(
                "rise flex flex-col gap-4 rounded-[var(--radius-sharp)] border-2 border-line bg-surface p-5 transition-colors hover:border-volt sm:flex-row sm:items-center sm:justify-between",
                stagger(i),
              )}
            >
              <div className="flex flex-col gap-2">
                <h2 className="display text-2xl text-bone">{saved.plan.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Tag>{GOAL_LABELS[saved.goal]}</Tag>
                  <Tag>{LEVEL_LABELS[saved.experienceLevel]}</Tag>
                  <Tag>
                    {saved.daysPerWeek} day{saved.daysPerWeek > 1 ? "s" : ""} / week
                  </Tag>
                  <span className="font-mono text-[0.65rem] uppercase tracking-widest text-bone-dim">
                    Saved {formatDate(saved.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {confirming ? (
                  <>
                    <span className="text-xs text-bone-dim">Delete this plan?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(saved.id)}
                      disabled={deleting}
                      aria-busy={deleting}
                      className={cn(
                        "press rounded-[var(--radius-sharp)] border-2 border-danger px-3 py-2",
                        "font-mono text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-danger",
                        "hover:bg-danger hover:text-ink hover:shadow-[3px_3px_0_0_var(--color-bone)] disabled:cursor-not-allowed disabled:opacity-60",
                      )}
                    >
                      {deleting ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      disabled={deleting}
                      className="press rounded-[var(--radius-sharp)] border-2 border-line px-3 py-2 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-bone-dim hover:border-bone hover:text-bone"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" onClick={() => onOpen(saved)}>
                      Open
                    </Button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(saved.id)}
                      aria-label={`Delete ${saved.plan.title}`}
                      className="press rounded-[var(--radius-sharp)] border-2 border-line px-3 py-2 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-bone-dim hover:border-danger hover:text-danger hover:shadow-[3px_3px_0_0_var(--color-danger)]"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[var(--radius-sharp)] border-2 border-line bg-ink px-2.5 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-bone">
      {children}
    </span>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
