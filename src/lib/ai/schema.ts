import { z } from "zod";

/**
 * THE AI CONTRACT — single source of truth.
 *
 * This module is pure Zod (no server-only imports) so it is safe to import from
 * both the API route (for `generateObject`) and client components (for the
 * `z.infer` types). Every output field carries a `.describe()` so the schema
 * doubles as guidance for the model. If the plan shape changes, change it HERE
 * first — types and validation follow automatically.
 */

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------
export const GOALS = [
  "strength",
  "hypertrophy",
  "endurance",
  "fat_loss",
  "general_fitness",
] as const;

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export const EQUIPMENT = [
  "full_gym",
  "dumbbells",
  "barbell",
  "kettlebell",
  "resistance_bands",
  "pull_up_bar",
  "machines",
  "bodyweight",
] as const;

export const goalSchema = z.enum(GOALS);
export const levelSchema = z.enum(LEVELS);
export const equipmentSchema = z.enum(EQUIPMENT);

export type Goal = z.infer<typeof goalSchema>;
export type Level = z.infer<typeof levelSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;

// ---------------------------------------------------------------------------
// INPUT — validated at the API boundary BEFORE any model call
// ---------------------------------------------------------------------------
export const generatePlanInputSchema = z.object({
  goal: goalSchema,
  experienceLevel: levelSchema,
  daysPerWeek: z.number().int().min(1).max(7),
  availableEquipment: z.array(equipmentSchema).min(1),
  sessionLengthMinutes: z.number().int().min(15).max(180).optional(),
  // Free text for injuries / preferences. Kept short and surfaced to the model.
  notes: z.string().max(500).optional(),
});

export type GeneratePlanInput = z.infer<typeof generatePlanInputSchema>;

// ---------------------------------------------------------------------------
// OUTPUT — what the LLM must return; what the UI renders
// ---------------------------------------------------------------------------
export const exerciseSchema = z.object({
  name: z.string().describe("Exercise name, e.g. 'Barbell Back Squat'"),
  targetMuscles: z.array(z.string()).describe("Primary muscles worked"),
  sets: z.number().int().min(1).max(10),
  reps: z.string().describe("Rep scheme as text: '8-12', 'AMRAP', '30s', '5'"),
  restSeconds: z.number().int().min(0).max(600).describe("Rest between sets, in seconds"),
  equipment: z.array(equipmentSchema).describe("Equipment this exercise needs"),
  tempo: z.string().optional().describe("Optional tempo, e.g. '3-1-1'"),
  rpe: z.string().optional().describe("Target intensity, e.g. 'RPE 7-8'"),
  cue: z.string().optional().describe("One short form / technique cue"),
});

export const workoutDaySchema = z.object({
  dayNumber: z.number().int().min(1).describe("1-based index within the week"),
  title: z.string().describe("Short session title, e.g. 'Upper Body — Push'"),
  focus: z.array(z.string()).describe("Muscle groups / themes for the day"),
  estimatedDurationMinutes: z.number().int().min(10).max(180),
  warmup: z.array(z.string()).describe("Brief warm-up steps"),
  exercises: z.array(exerciseSchema).min(1),
  rationale: z.string().describe("WHY this day is structured this way — product value"),
});

export const progressionSchema = z.object({
  strategy: z.string().describe("Name, e.g. 'Double progression', 'Linear'"),
  description: z.string().describe("How the plan advances week to week"),
  weeklyAdjustments: z.array(z.string()).describe("Concrete week-by-week steps"),
  deloadGuidance: z.string().optional().describe("When and how to deload"),
});

export const workoutPlanSchema = z.object({
  title: z.string().describe("Catchy plan title"),
  summary: z.string().describe("1-2 sentence overview"),
  goal: goalSchema,
  experienceLevel: levelSchema,
  daysPerWeek: z.number().int().min(1).max(7),
  rationale: z.string().describe("Overall WHY: the strategy behind the whole plan"),
  days: z.array(workoutDaySchema).min(1),
  progression: progressionSchema,
});

export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;
export type WorkoutDay = z.infer<typeof workoutDaySchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Progression = z.infer<typeof progressionSchema>;
