import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/AuthForm";

const { signInMock, signUpMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
}));

vi.mock("@/lib/db/supabase-browser", () => ({
  isSupabaseConfiguredBrowser: () => true,
  createBrowserSupabaseClient: () => ({
    auth: { signInWithPassword: signInMock, signUp: signUpMock },
  }),
}));

// AuthForm hard-navigates on success. jsdom's location.assign isn't spy-able, so
// swap window.location for a plain stub (keeping `origin` for the sign-up flow).
const assignSpy = vi.fn();

beforeEach(() => {
  assignSpy.mockReset();
  signInMock.mockReset();
  signUpMock.mockReset();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "http://localhost:3000", assign: assignSpy },
  });
});

async function fillCredentials(email = "a@b.com", password = "secret123") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  return user;
}

describe("AuthForm (sign-in)", () => {
  it("signs in and navigates to the redirect target", async () => {
    signInMock.mockResolvedValue({ error: null });
    render(<AuthForm mode="sign-in" redirectTo="/plans" />);

    const user = await fillCredentials();
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(signInMock).toHaveBeenCalledWith({ email: "a@b.com", password: "secret123" });
    expect(assignSpy).toHaveBeenCalledWith("/plans");
  });

  it("falls back to the home screen when redirectTo is unsafe", async () => {
    signInMock.mockResolvedValue({ error: null });
    render(<AuthForm mode="sign-in" redirectTo="//evil.com" />);

    const user = await fillCredentials();
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(assignSpy).toHaveBeenCalledWith("/");
  });

  it("surfaces an accessible error on failure", async () => {
    signInMock.mockResolvedValue({ error: new Error("Invalid login credentials") });
    render(<AuthForm mode="sign-in" redirectTo={null} />);

    const user = await fillCredentials();
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid login credentials");
    expect(assignSpy).not.toHaveBeenCalled();
  });
});

describe("AuthForm (sign-up)", () => {
  it("redirects immediately when a session is returned (confirmation off)", async () => {
    signUpMock.mockResolvedValue({ data: { session: { access_token: "x" } }, error: null });
    render(<AuthForm mode="sign-up" redirectTo="/plans" />);

    const user = await fillCredentials();
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(signUpMock).toHaveBeenCalled();
    expect(assignSpy).toHaveBeenCalledWith("/plans");
  });

  it("shows a confirm-your-email state when no session is returned", async () => {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    render(<AuthForm mode="sign-up" redirectTo={null} />);

    const user = await fillCredentials();
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/confirmation link/i)).toBeInTheDocument();
    expect(assignSpy).not.toHaveBeenCalled();
  });
});
