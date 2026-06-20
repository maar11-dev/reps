"use client";

import { useState } from "react";
import { BuilderForm } from "@/components/builder/BuilderForm";
import { PlanView } from "@/components/plan/PlanView";
import { SiteHeader } from "@/components/SiteHeader";
import { GeneratePlanError, requestPlan } from "@/lib/ai/api";
import type { GeneratePlanInput } from "@/lib/ai/schema";
import { usePlansStore } from "@/lib/store/plans-store";

/**
 * The builder route — the client island that holds form state, calls
 * `/api/generate`, and swaps to the plan view on success. The current plan lives
 * in the store (`draft`), so a plan opened from "My plans" renders here too, and
 * in-session edits (swaps) persist across the two views. It only ever touches the
 * server-only generation code through `requestPlan` (a `fetch`), never by importing it.
 */
export default function BuildPage() {
  const draft = usePlansStore((s) => s.draft);
  const setDraft = usePlansStore((s) => s.setDraft);
  const resetDraft = usePlansStore((s) => s.resetDraft);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: GeneratePlanInput) {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await requestPlan(input);
      setDraft(result);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof GeneratePlanError
          ? err.message
          : "Something went wrong generating your plan. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        {draft ? (
          <PlanView onReset={() => resetDraft()} />
        ) : (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <span className="kicker w-fit border-2 border-volt bg-volt/10 px-3 py-1.5 text-volt">
                Plan builder
              </span>
              <h1 className="display text-5xl text-bone sm:text-7xl">
                Let&apos;s build your <span className="text-volt">week.</span>
              </h1>
              <p className="max-w-xl text-bone-dim">
                Four quick choices and Reps drafts a structured program you can train from today.
              </p>
            </div>
            <BuilderForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitError={error} />
          </div>
        )}
      </main>
    </>
  );
}
