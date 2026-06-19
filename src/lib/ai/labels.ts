import type { Equipment, Goal, Level } from "@/lib/ai/schema";

/**
 * Human-readable labels for the enum values. Shared by the builder form and the
 * plan view so the two never drift. Isomorphic (no server imports).
 */

export const GOAL_LABELS: Record<Goal, string> = {
  strength: "Strength",
  hypertrophy: "Muscle / Hypertrophy",
  endurance: "Endurance",
  fat_loss: "Fat Loss",
  general_fitness: "General Fitness",
};

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  full_gym: "Full Gym",
  dumbbells: "Dumbbells",
  barbell: "Barbell",
  kettlebell: "Kettlebell",
  resistance_bands: "Resistance Bands",
  pull_up_bar: "Pull-up Bar",
  machines: "Machines",
  bodyweight: "Bodyweight",
};

/** Format a seconds value as a compact rest label, e.g. 90 -> "90s", 120 -> "2m". */
export function formatRest(seconds: number): string {
  if (seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes}m` : `${seconds}s`;
}
