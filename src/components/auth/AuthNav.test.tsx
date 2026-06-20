import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthNav } from "@/components/auth/AuthNav";

const { pushMock, refreshMock, getUserMock, onAuthStateChangeMock, signOutMock, unsubscribeMock } =
  vi.hoisted(() => ({
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    getUserMock: vi.fn(),
    onAuthStateChangeMock: vi.fn(),
    signOutMock: vi.fn(),
    unsubscribeMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/lib/db/supabase-browser", () => ({
  isSupabaseConfiguredBrowser: () => true,
  createBrowserSupabaseClient: () => ({
    auth: {
      getUser: getUserMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
    },
  }),
}));

beforeEach(() => {
  pushMock.mockReset();
  refreshMock.mockReset();
  getUserMock.mockReset();
  signOutMock.mockReset().mockResolvedValue({ error: null });
  onAuthStateChangeMock
    .mockReset()
    .mockReturnValue({ data: { subscription: { unsubscribe: unsubscribeMock } } });
});

describe("AuthNav", () => {
  it("shows the display name (not the email) and a sign-out button when signed in", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "lifter@reps.app", user_metadata: { display_name: "Alex" } } },
    });
    render(<AuthNav />);

    expect(await screen.findByText("Alex")).toBeInTheDocument();
    expect(screen.queryByText("lifter@reps.app")).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(signOutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("falls back to the email when no display name is set", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "lifter@reps.app" } } });
    render(<AuthNav />);

    expect(await screen.findByText("lifter@reps.app")).toBeInTheDocument();
  });

  it("shows a sign-in link when signed out", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    render(<AuthNav />);

    expect(await screen.findByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});
