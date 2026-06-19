import { type NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai/generate";
import { generatePlanInputSchema } from "@/lib/ai/schema";

// The AI key and model call require the Node.js runtime (not Edge).
export const runtime = "nodejs";
// Plans are always generated fresh per request.
export const dynamic = "force-dynamic";

/**
 * POST /api/generate
 *
 * Validates the request body with Zod at the boundary, then delegates to the
 * server-only `generatePlan`. Returns a typed, schema-validated `WorkoutPlan` on
 * success. Raw exceptions never reach the client — they become a 500 with a
 * generic message (see CLAUDE.md: "never let raw exceptions reach the client").
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = generatePlanInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const plan = await generatePlan(parsed.data);
    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error("[/api/generate] generation failed:", error);
    return NextResponse.json(
      { error: "Could not generate a plan right now. Please try again." },
      { status: 500 },
    );
  }
}
