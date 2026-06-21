"use client";

import { useRouter } from "next/navigation";
import { MyPlansView } from "@/components/plan/MyPlansView";
import { SiteHeader } from "@/components/SiteHeader";
import type { SavedPlan } from "@/lib/db/types";
import { usePlansStore } from "@/lib/store/plans-store";

/**
 * "My plans" route — the saved-plan library. Opening a plan loads it into the
 * store (so `/build` renders it from the draft) and navigates there.
 */
export default function PlansPage() {
  const router = useRouter();
  const loadSavedPlan = usePlansStore((s) => s.loadSavedPlan);

  function handleOpen(saved: SavedPlan) {
    loadSavedPlan(saved);
    router.push("/build");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <span className="kicker rise w-fit border-2 border-volt bg-volt/10 px-3 py-1.5 text-volt [animation-delay:40ms]">
              Your library
            </span>
            <h1 className="display rise text-5xl text-bone [animation-delay:120ms] sm:text-7xl">
              My <span className="text-volt">plans.</span>
            </h1>
            <p className="rise max-w-xl text-bone-dim [animation-delay:200ms]">
              Open a saved plan to train or edit it, or clear out the ones you&apos;re done with.
            </p>
          </div>
          <MyPlansView onOpen={handleOpen} />
        </div>
      </main>
    </>
  );
}
