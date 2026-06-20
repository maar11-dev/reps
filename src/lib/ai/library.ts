import type { Equipment } from "@/lib/ai/schema";

/**
 * Deterministic exercise library + equipment helpers.
 *
 * Isomorphic (no `server-only`) so it is shared by the mock plan generator
 * (`mock.ts`) AND the mock exercise swap (`swap.ts`). Keeping the catalogue in one
 * place is what lets the swap pick an equivalent movement — same pattern / muscle
 * group, available equipment — without duplicating the data.
 */

export type Pattern = "push" | "pull" | "legs" | "core" | "conditioning";

export interface ExerciseTemplate {
  name: string;
  targetMuscles: string[];
  pattern: Pattern;
  /** Any one of these satisfies the exercise. `bodyweight` items are universal. */
  equipment: Equipment[];
  cue?: string;
}

export const LIBRARY: ExerciseTemplate[] = [
  // Push
  {
    name: "Barbell Bench Press",
    targetMuscles: ["Chest", "Triceps", "Front Delts"],
    pattern: "push",
    equipment: ["barbell", "full_gym"],
    cue: "Pin the shoulder blades; bar to mid-chest.",
  },
  {
    name: "Dumbbell Shoulder Press",
    targetMuscles: ["Shoulders", "Triceps"],
    pattern: "push",
    equipment: ["dumbbells", "full_gym"],
    cue: "Stack wrists over elbows.",
  },
  {
    name: "Machine Chest Press",
    targetMuscles: ["Chest", "Triceps"],
    pattern: "push",
    equipment: ["machines", "full_gym"],
  },
  {
    name: "Push-up",
    targetMuscles: ["Chest", "Triceps", "Core"],
    pattern: "push",
    equipment: ["bodyweight"],
    cue: "Body in one straight line, elbows ~45°.",
  },
  {
    name: "Band Overhead Press",
    targetMuscles: ["Shoulders", "Triceps"],
    pattern: "push",
    equipment: ["resistance_bands"],
  },
  // Pull
  {
    name: "Barbell Bent-over Row",
    targetMuscles: ["Back", "Biceps"],
    pattern: "pull",
    equipment: ["barbell", "full_gym"],
    cue: "Hinge ~45°, drive elbows to hips.",
  },
  {
    name: "Pull-up",
    targetMuscles: ["Lats", "Biceps"],
    pattern: "pull",
    equipment: ["pull_up_bar", "full_gym"],
    cue: "Lead with the chest, full hang at the bottom.",
  },
  {
    name: "Dumbbell Row",
    targetMuscles: ["Back", "Biceps"],
    pattern: "pull",
    equipment: ["dumbbells", "full_gym"],
  },
  {
    name: "Band Pull-apart",
    targetMuscles: ["Rear Delts", "Upper Back"],
    pattern: "pull",
    equipment: ["resistance_bands"],
  },
  {
    name: "Inverted Row",
    targetMuscles: ["Back", "Biceps"],
    pattern: "pull",
    equipment: ["bodyweight"],
  },
  // Legs
  {
    name: "Barbell Back Squat",
    targetMuscles: ["Quads", "Glutes"],
    pattern: "legs",
    equipment: ["barbell", "full_gym"],
    cue: "Brace hard, sit between the hips.",
  },
  {
    name: "Goblet Squat",
    targetMuscles: ["Quads", "Glutes"],
    pattern: "legs",
    equipment: ["dumbbells", "kettlebell", "full_gym"],
  },
  {
    name: "Kettlebell Swing",
    targetMuscles: ["Hamstrings", "Glutes"],
    pattern: "legs",
    equipment: ["kettlebell", "full_gym"],
    cue: "Snap the hips; the arms just follow.",
  },
  {
    name: "Romanian Deadlift",
    targetMuscles: ["Hamstrings", "Glutes"],
    pattern: "legs",
    equipment: ["barbell", "dumbbells", "full_gym"],
  },
  {
    name: "Bodyweight Split Squat",
    targetMuscles: ["Quads", "Glutes"],
    pattern: "legs",
    equipment: ["bodyweight"],
  },
  // Core
  {
    name: "Plank",
    targetMuscles: ["Core"],
    pattern: "core",
    equipment: ["bodyweight"],
    cue: "Squeeze glutes; ribs down.",
  },
  {
    name: "Hanging Knee Raise",
    targetMuscles: ["Abs", "Hip Flexors"],
    pattern: "core",
    equipment: ["pull_up_bar", "full_gym"],
  },
  { name: "Dead Bug", targetMuscles: ["Core"], pattern: "core", equipment: ["bodyweight"] },
  // Conditioning
  {
    name: "Burpee Intervals",
    targetMuscles: ["Full Body"],
    pattern: "conditioning",
    equipment: ["bodyweight"],
  },
  {
    name: "Kettlebell Complex",
    targetMuscles: ["Full Body"],
    pattern: "conditioning",
    equipment: ["kettlebell", "full_gym"],
  },
];

/** Can this template be performed with the available kit? */
export function isAvailable(template: ExerciseTemplate, available: Equipment[]): boolean {
  if (template.equipment.includes("bodyweight")) return true; // always doable
  if (available.includes("full_gym")) return true;
  return template.equipment.some((e) => available.includes(e));
}

/** Resolve which template equipment to display for the available kit. */
export function pickEquipment(template: ExerciseTemplate, available: Equipment[]): Equipment[] {
  if (available.includes("full_gym")) {
    const real = template.equipment.find((e) => e !== "full_gym");
    return [real ?? template.equipment[0]];
  }
  const match = template.equipment.find((e) => available.includes(e));
  if (match) return [match];
  return ["bodyweight"]; // fallback variant
}
