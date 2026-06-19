// @vitest-environment node
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/generate/route";
import { workoutPlanSchema } from "@/lib/ai/schema";

type RouteRequest = Parameters<typeof POST>[0];

function jsonRequest(body: unknown): RouteRequest {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as RouteRequest;
}

describe("POST /api/generate", () => {
  it("returns a schema-valid plan for valid input (mock mode)", async () => {
    const res = await POST(
      jsonRequest({
        goal: "strength",
        experienceLevel: "beginner",
        daysPerWeek: 3,
        availableEquipment: ["dumbbells"],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(() => workoutPlanSchema.parse(json)).not.toThrow();
    expect(json.days).toHaveLength(3);
  });

  it("returns 400 with issues for invalid input", async () => {
    const res = await POST(jsonRequest({ goal: "not-a-goal" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
    expect(Array.isArray(json.issues)).toBe(true);
  });

  it("returns 400 for a non-JSON body", async () => {
    const bad = new Request("http://localhost/api/generate", {
      method: "POST",
      body: "{ not json",
    }) as unknown as RouteRequest;
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });
});
