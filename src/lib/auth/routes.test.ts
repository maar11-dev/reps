// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isProtectedPath, safeRedirectTo } from "@/lib/auth/routes";

describe("isProtectedPath", () => {
  it("protects the saved-plans library", () => {
    expect(isProtectedPath("/plans")).toBe(true);
    expect(isProtectedPath("/plans/abc-123")).toBe(true);
  });

  it("leaves public routes open", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/build")).toBe(false);
    expect(isProtectedPath("/sign-in")).toBe(false);
    // Not a prefix-boundary match.
    expect(isProtectedPath("/planslike")).toBe(false);
  });
});

describe("safeRedirectTo", () => {
  it("accepts internal absolute paths", () => {
    expect(safeRedirectTo("/plans")).toBe("/plans");
    expect(safeRedirectTo("/build")).toBe("/build");
  });

  it("rejects external or protocol-relative targets", () => {
    expect(safeRedirectTo("//evil.com")).toBeNull();
    expect(safeRedirectTo("https://evil.com")).toBeNull();
    expect(safeRedirectTo("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty / missing values", () => {
    expect(safeRedirectTo("")).toBeNull();
    expect(safeRedirectTo(null)).toBeNull();
    expect(safeRedirectTo(undefined)).toBeNull();
  });
});
