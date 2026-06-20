// @vitest-environment node
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/swap/route";
import { exerciseSchema } from "@/lib/ai/schema";

type RouteRequest = Parameters<typeof POST>[0];

function jsonRequest(body: unknown): RouteRequest {
  return new Request("http://localhost/api/swap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as RouteRequest;
}

const validBody = {
  current: {
    name: "Barbell Bench Press",
    targetMuscles: ["Chest", "Triceps"],
    sets: 4,
    reps: "8-12",
    restSeconds: 90,
    equipment: ["barbell"],
  },
  availableEquipment: ["full_gym"],
  goal: "hypertrophy",
  experienceLevel: "intermediate",
  dayFocus: ["Chest", "Triceps"],
};

describe("POST /api/swap", () => {
  it("returns a schema-valid substitute for valid input (mock mode)", async () => {
    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(() => exerciseSchema.parse(json)).not.toThrow();
    expect(json.name).not.toBe(validBody.current.name);
  });

  it("returns 400 with issues for invalid input", async () => {
    const res = await POST(jsonRequest({ current: { name: "x" } }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
    expect(Array.isArray(json.issues)).toBe(true);
  });

  it("returns 400 for a non-JSON body", async () => {
    const bad = new Request("http://localhost/api/swap", {
      method: "POST",
      body: "{ not json",
    }) as unknown as RouteRequest;
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });
});
