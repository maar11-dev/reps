import { type NextRequest, NextResponse } from "next/server";
import { swapExerciseInputSchema } from "@/lib/ai/schema";
import { swapExercise } from "@/lib/ai/swap";

// The AI key and model call require the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/swap
 *
 * Validates the request with `swapExerciseInputSchema`, then delegates to the
 * server-only `swapExercise`. Returns a single schema-valid `Exercise`. Same
 * error discipline as /api/generate — raw exceptions never reach the client.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = swapExerciseInputSchema.safeParse(body);
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
    const exercise = await swapExercise(parsed.data);
    return NextResponse.json(exercise, { status: 200 });
  } catch (error) {
    console.error("[/api/swap] swap failed:", error);
    return NextResponse.json(
      { error: "Could not find a swap right now. Please try again." },
      { status: 500 },
    );
  }
}
