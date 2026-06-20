import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserId } from "@/lib/db/auth";
import { listPlans, savePlan } from "@/lib/db/plans";
import { getPlansRepository } from "@/lib/db/supabase";

// DB access + auth require the Node.js runtime, and responses are per-user.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/plans  — list the current user's saved plans (newest first).
 * POST /api/plans  — save a plan (body must be a schema-valid WorkoutPlan).
 *
 * Same error discipline as /api/generate: validated input, typed errors, never a
 * raw exception to the client. 401 when there is no authenticated user.
 */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const repo = await getPlansRepository();
    const plans = await listPlans(repo, userId);
    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("[/api/plans] list failed:", error);
    return NextResponse.json({ error: "Could not load your plans." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    const repo = await getPlansRepository();
    const saved = await savePlan(repo, userId, body);
    return NextResponse.json({ plan: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }
    console.error("[/api/plans] save failed:", error);
    return NextResponse.json({ error: "Could not save your plan." }, { status: 500 });
  }
}
