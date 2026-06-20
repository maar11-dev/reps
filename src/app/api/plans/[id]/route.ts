import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserId } from "@/lib/db/auth";
import { deletePlan, getPlan, updatePlan } from "@/lib/db/plans";
import { getPlansRepository } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * GET    /api/plans/:id  — fetch one of the current user's plans.
 * PUT    /api/plans/:id  — replace the stored plan (body = schema-valid WorkoutPlan).
 * DELETE /api/plans/:id  — remove it.
 *
 * 401 when unauthenticated, 404 when the row is missing or not owned by the user
 * (ownership is also enforced by the repository / RLS).
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  try {
    const repo = await getPlansRepository();
    const plan = await getPlan(repo, userId, id);
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    console.error("[/api/plans/:id] get failed:", error);
    return NextResponse.json({ error: "Could not load that plan." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    const repo = await getPlansRepository();
    const plan = await updatePlan(repo, userId, id, body);
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }
    console.error("[/api/plans/:id] update failed:", error);
    return NextResponse.json({ error: "Could not update that plan." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  try {
    const repo = await getPlansRepository();
    const removed = await deletePlan(repo, userId, id);
    if (!removed) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[/api/plans/:id] delete failed:", error);
    return NextResponse.json({ error: "Could not delete that plan." }, { status: 500 });
  }
}
