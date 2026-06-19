import { EQUIPMENT_LABELS, GOAL_LABELS, LEVEL_LABELS } from "@/lib/ai/labels";
import type { GeneratePlanInput } from "@/lib/ai/schema";

/**
 * Prompt builders for the workout-plan generation.
 *
 * Pure string functions (no I/O), kept separate from `generate.ts` so they can
 * be unit-tested and reviewed independently. The system prompt deliberately
 * requires per-day and overall rationale — the "why" is product value and must
 * not be stripped (see CLAUDE.md, "The AI Contract").
 */

export const SYSTEM_PROMPT = `You are a certified strength & conditioning coach generating structured weekly training plans.

Rules:
- Respect the athlete's goal, experience level, available equipment, and weekly availability EXACTLY.
- Only prescribe exercises that can be performed with the listed equipment.
- Produce exactly the requested number of training days. Each day must have a clear focus.
- Choose volume, intensity, and rest appropriate to the goal and level (e.g. lower reps / longer rest for strength; moderate reps / shorter rest for hypertrophy; circuits for endurance/fat loss).
- ALWAYS explain the "why": give an overall rationale for the plan AND a rationale for each day. This reasoning is the core value — be specific, not generic.
- Provide a concrete progression strategy with week-by-week adjustments.
- Be safe and conservative for beginners. Do not give medical advice.
- Return ONLY data that matches the provided schema.`;

export function buildUserPrompt(input: GeneratePlanInput): string {
  const equipment = input.availableEquipment.map((e) => EQUIPMENT_LABELS[e]).join(", ");
  const lines = [
    `Goal: ${GOAL_LABELS[input.goal]}`,
    `Experience level: ${LEVEL_LABELS[input.experienceLevel]}`,
    `Training days per week: ${input.daysPerWeek}`,
    `Available equipment: ${equipment}`,
  ];
  if (input.sessionLengthMinutes) {
    lines.push(`Target session length: ~${input.sessionLengthMinutes} minutes`);
  }
  if (input.notes?.trim()) {
    lines.push(`Athlete notes (injuries / preferences): ${input.notes.trim()}`);
  }
  lines.push(
    "",
    `Design a ${input.daysPerWeek}-day weekly plan tailored to the above. Explain your reasoning.`,
  );
  return lines.join("\n");
}
