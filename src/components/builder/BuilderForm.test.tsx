import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BuilderForm } from "@/components/builder/BuilderForm";

describe("BuilderForm", () => {
  it("renders the core fields", () => {
    render(<BuilderForm onSubmit={vi.fn()} />);
    expect(screen.getByText("Primary Goal")).toBeInTheDocument();
    expect(screen.getByText("Experience Level")).toBeInTheDocument();
    expect(screen.getByText("Available Equipment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate plan/i })).toBeInTheDocument();
  });

  it("submits valid input with the chosen values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BuilderForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /generate plan/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        goal: "hypertrophy",
        experienceLevel: "beginner",
        daysPerWeek: 3,
        availableEquipment: ["full_gym"],
      }),
    );
  });

  it("blocks submit when no equipment is selected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BuilderForm onSubmit={onSubmit} />);

    // The only default equipment is "Full Gym" — toggle it off to empty the list.
    await user.click(screen.getByRole("button", { name: /full gym/i }));
    await user.click(screen.getByRole("button", { name: /generate plan/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
