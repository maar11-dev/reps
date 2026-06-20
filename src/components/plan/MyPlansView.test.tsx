import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MyPlansView } from "@/components/plan/MyPlansView";
import type { WorkoutPlan } from "@/lib/ai/schema";
import { deleteSavedPlan, listSavedPlans, PlansApiError } from "@/lib/api/plans";
import type { SavedPlan } from "@/lib/db/types";
import { initialPlansState, usePlansStore } from "@/lib/store/plans-store";

vi.mock("@/lib/api/plans", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api/plans")>();
  return {
    ...actual,
    listSavedPlans: vi.fn(),
    deleteSavedPlan: vi.fn(),
  };
});

const PLAN: WorkoutPlan = {
  title: "Stub",
  summary: "s",
  goal: "strength",
  experienceLevel: "beginner",
  daysPerWeek: 2,
  rationale: "r",
  days: [
    {
      dayNumber: 1,
      title: "Day",
      focus: ["X"],
      estimatedDurationMinutes: 40,
      warmup: ["w"],
      exercises: [
        {
          name: "Squat",
          targetMuscles: ["Quads"],
          sets: 3,
          reps: "5",
          restSeconds: 120,
          equipment: ["barbell"],
        },
      ],
      rationale: "r",
    },
  ],
  progression: { strategy: "Linear", description: "d", weeklyAdjustments: ["a"] },
};

const saved = (id: string, title: string): SavedPlan => ({
  id,
  userId: "u1",
  title,
  goal: "strength",
  experienceLevel: "beginner",
  daysPerWeek: 2,
  plan: { ...PLAN, title },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

beforeEach(() => {
  usePlansStore.setState(initialPlansState);
  vi.mocked(listSavedPlans).mockReset();
  vi.mocked(deleteSavedPlan).mockReset();
});

describe("MyPlansView", () => {
  it("lists the user's saved plans", async () => {
    vi.mocked(listSavedPlans).mockResolvedValue([saved("a", "Alpha"), saved("b", "Bravo")]);
    render(<MyPlansView onOpen={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bravo" })).toBeInTheDocument();
  });

  it("shows an empty state when there are no plans", async () => {
    vi.mocked(listSavedPlans).mockResolvedValue([]);
    render(<MyPlansView onOpen={vi.fn()} />);
    expect(await screen.findByText(/haven't saved any plans/i)).toBeInTheDocument();
  });

  it("shows an accessible error when loading fails", async () => {
    vi.mocked(listSavedPlans).mockRejectedValue(new PlansApiError("Boom", 500));
    render(<MyPlansView onOpen={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Boom");
  });

  it("opens a plan via the onOpen callback", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    vi.mocked(listSavedPlans).mockResolvedValue([saved("a", "Alpha")]);
    render(<MyPlansView onOpen={onOpen} />);

    await user.click(await screen.findByRole("button", { name: /^open$/i }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });

  it("requires confirmation before deleting, then removes the plan", async () => {
    const user = userEvent.setup();
    vi.mocked(listSavedPlans).mockResolvedValue([saved("a", "Alpha"), saved("b", "Bravo")]);
    vi.mocked(deleteSavedPlan).mockResolvedValue();
    render(<MyPlansView onOpen={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /delete alpha/i }));
    // Delete is NOT called until the confirmation is clicked.
    expect(deleteSavedPlan).not.toHaveBeenCalled();
    expect(screen.getByText(/delete this plan\?/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /yes, delete/i }));
    expect(deleteSavedPlan).toHaveBeenCalledWith("a");
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Alpha" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("heading", { name: "Bravo" })).toBeInTheDocument();
  });

  it("can cancel a delete confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(listSavedPlans).mockResolvedValue([saved("a", "Alpha")]);
    render(<MyPlansView onOpen={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /delete alpha/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByRole("button", { name: /^open$/i })).toBeInTheDocument();
    expect(deleteSavedPlan).not.toHaveBeenCalled();
  });
});
