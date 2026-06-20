import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SavePlanButton } from "@/components/plan/SavePlanButton";
import type { WorkoutPlan } from "@/lib/ai/schema";
import { PlansApiError, saveCurrentPlan, updateSavedPlan } from "@/lib/api/plans";
import type { SavedPlan } from "@/lib/db/types";
import { initialPlansState, usePlansStore } from "@/lib/store/plans-store";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

// vi.mock is hoisted above the imports by Vitest, so the bridge is mocked even
// though it is imported with the others. PlansApiError is kept real for instanceof.
vi.mock("@/lib/api/plans", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api/plans")>();
  return {
    ...actual,
    saveCurrentPlan: vi.fn(),
    updateSavedPlan: vi.fn(),
  };
});

const PLAN: WorkoutPlan = {
  title: "Test Plan",
  summary: "Summary.",
  goal: "hypertrophy",
  experienceLevel: "intermediate",
  daysPerWeek: 1,
  rationale: "Overall.",
  days: [
    {
      dayNumber: 1,
      title: "Full Body",
      focus: ["Total"],
      estimatedDurationMinutes: 45,
      warmup: ["cardio"],
      exercises: [
        {
          name: "Squat",
          targetMuscles: ["Quads"],
          sets: 3,
          reps: "8-12",
          restSeconds: 90,
          equipment: ["barbell"],
        },
      ],
      rationale: "Legs.",
    },
  ],
  progression: { strategy: "Linear", description: "Add load.", weeklyAdjustments: ["+2.5kg"] },
};

const saved = (id: string): SavedPlan => ({
  id,
  userId: "u1",
  title: PLAN.title,
  goal: PLAN.goal,
  experienceLevel: PLAN.experienceLevel,
  daysPerWeek: PLAN.daysPerWeek,
  plan: PLAN,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

beforeEach(() => {
  usePlansStore.setState(initialPlansState);
  pushMock.mockReset();
  vi.mocked(saveCurrentPlan).mockReset();
  vi.mocked(updateSavedPlan).mockReset();
});

describe("SavePlanButton", () => {
  it("renders nothing without a draft", () => {
    const { container } = render(<SavePlanButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("POSTs a new plan and reflects the saved state", async () => {
    const user = userEvent.setup();
    usePlansStore.setState({ draft: PLAN, draftSavedId: null, isDirty: false });
    vi.mocked(saveCurrentPlan).mockResolvedValue(saved("new-1"));

    render(<SavePlanButton />);
    await user.click(screen.getByRole("button", { name: /save plan/i }));

    expect(saveCurrentPlan).toHaveBeenCalledWith(PLAN);
    expect(updateSavedPlan).not.toHaveBeenCalled();
    // Store now tracks the saved id and library; button reflects "saved".
    expect(usePlansStore.getState().draftSavedId).toBe("new-1");
    expect(usePlansStore.getState().savedPlans.map((p) => p.id)).toEqual(["new-1"]);
    expect(await screen.findByRole("button", { name: /saved/i })).toBeDisabled();
  });

  it("PUTs in-session edits when the draft is already saved and dirty", async () => {
    const user = userEvent.setup();
    usePlansStore.setState({ draft: PLAN, draftSavedId: "existing-1", isDirty: true });
    vi.mocked(updateSavedPlan).mockResolvedValue(saved("existing-1"));

    render(<SavePlanButton />);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(updateSavedPlan).toHaveBeenCalledWith("existing-1", PLAN);
    expect(saveCurrentPlan).not.toHaveBeenCalled();
  });

  it("is disabled with a 'Saved' label when there is nothing to persist", () => {
    usePlansStore.setState({ draft: PLAN, draftSavedId: "existing-1", isDirty: false });
    render(<SavePlanButton />);
    expect(screen.getByRole("button", { name: /saved/i })).toBeDisabled();
  });

  it("surfaces an accessible error when the save fails", async () => {
    const user = userEvent.setup();
    usePlansStore.setState({ draft: PLAN, draftSavedId: null, isDirty: false });
    vi.mocked(saveCurrentPlan).mockRejectedValue(new PlansApiError("Server boom", 500));

    render(<SavePlanButton />);
    await user.click(screen.getByRole("button", { name: /save plan/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Server boom");
  });

  it("redirects to sign-in when saving returns 401 (no session)", async () => {
    const user = userEvent.setup();
    usePlansStore.setState({ draft: PLAN, draftSavedId: null, isDirty: false });
    vi.mocked(saveCurrentPlan).mockRejectedValue(new PlansApiError("Not authenticated.", 401));

    render(<SavePlanButton />);
    await user.click(screen.getByRole("button", { name: /save plan/i }));

    await vi.waitFor(() => expect(pushMock).toHaveBeenCalledWith("/sign-in?redirectTo=/build"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
