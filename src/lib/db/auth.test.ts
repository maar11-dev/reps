// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEV_USER_ID, getCurrentUserId } from "@/lib/db/auth";

// With no Supabase env, `getCurrentUserId` short-circuits before touching the
// network, so these tests stay hermetic.
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getCurrentUserId fallback (Supabase unconfigured)", () => {
  it("returns the dev stub id in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(await getCurrentUserId()).toBe(DEV_USER_ID);
  });

  it("returns null in production (forces real auth)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(await getCurrentUserId()).toBeNull();
  });
});
