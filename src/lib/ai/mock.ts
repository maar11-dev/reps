import "server-only";

import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/ai/labels";
import { isAvailable, LIBRARY, type Pattern, pickEquipment } from "@/lib/ai/library";
import type {
  Exercise,
  GeneratePlanInput,
  Goal,
  Level,
  Progression,
  WorkoutDay,
  WorkoutPlan,
} from "@/lib/ai/schema";

/**
 * Deterministic mock plan generator.
 *
 * Produces a plan that is ALREADY valid against `workoutPlanSchema` so the whole
 * UI can be exercised without spending real LLM calls. It honours the input:
 * the right number of days, exercises selectable with the available equipment,
 * and goal/level-appropriate sets / reps / rest. Keeping it deterministic also
 * makes it trivial to assert on in tests. The exercise catalogue + equipment
 * helpers live in `library.ts` so the swap endpoint can reuse them.
 */

/** A day's focus expressed as the title + the movement patterns it draws from. */
interface DayBlueprint {
  title: string;
  focus: string[];
  patterns: Pattern[];
}

function splitFor(days: number): DayBlueprint[] {
  const push: DayBlueprint = {
    title: "Upper Body — Push",
    focus: ["Chest", "Shoulders", "Triceps"],
    patterns: ["push", "core"],
  };
  const pull: DayBlueprint = {
    title: "Upper Body — Pull",
    focus: ["Back", "Biceps"],
    patterns: ["pull", "core"],
  };
  const legs: DayBlueprint = {
    title: "Lower Body",
    focus: ["Quads", "Hamstrings", "Glutes"],
    patterns: ["legs", "core"],
  };
  const upper: DayBlueprint = {
    title: "Upper Body",
    focus: ["Chest", "Back", "Arms"],
    patterns: ["push", "pull"],
  };
  const lower: DayBlueprint = {
    title: "Lower Body",
    focus: ["Quads", "Hamstrings", "Glutes"],
    patterns: ["legs", "core"],
  };
  const full: DayBlueprint = {
    title: "Full Body",
    focus: ["Total Body"],
    patterns: ["legs", "push", "pull"],
  };
  const conditioning: DayBlueprint = {
    title: "Conditioning & Core",
    focus: ["Engine", "Core"],
    patterns: ["conditioning", "core"],
  };

  switch (days) {
    case 1:
      return [full];
    case 2:
      return [upper, lower];
    case 3:
      return [push, pull, legs];
    case 4:
      return [upper, lower, push, pull];
    case 5:
      return [push, pull, legs, upper, lower];
    case 6:
      return [push, pull, legs, push, pull, legs];
    default:
      return [push, pull, legs, upper, lower, conditioning, conditioning];
  }
}

interface Prescription {
  sets: number;
  reps: string;
  restSeconds: number;
  rpe?: string;
}

function prescriptionFor(goal: Goal, level: Level): Prescription {
  const base: Record<Goal, Prescription> = {
    strength: { sets: 5, reps: "4-6", restSeconds: 180, rpe: "RPE 8" },
    hypertrophy: { sets: 4, reps: "8-12", restSeconds: 90, rpe: "RPE 8-9" },
    endurance: { sets: 3, reps: "15-20", restSeconds: 45, rpe: "RPE 7" },
    fat_loss: { sets: 3, reps: "12-15", restSeconds: 45, rpe: "RPE 7-8" },
    general_fitness: { sets: 3, reps: "8-12", restSeconds: 75, rpe: "RPE 7" },
  };
  const p = { ...base[goal] };
  // Beginners run a touch less volume; advanced a touch more.
  if (level === "beginner") p.sets = Math.max(2, p.sets - 1);
  if (level === "advanced") p.sets = Math.min(6, p.sets + 1);
  return p;
}

function buildDay(
  blueprint: DayBlueprint,
  dayNumber: number,
  input: GeneratePlanInput,
  rx: Prescription,
): WorkoutDay {
  const available = input.availableEquipment;
  const exercises: Exercise[] = [];

  for (const pattern of blueprint.patterns) {
    const candidates = LIBRARY.filter((t) => t.pattern === pattern && isAvailable(t, available));
    // Rotate the starting point by day so repeated focuses vary across the week.
    const take = pattern === "core" || pattern === "conditioning" ? 1 : 2;
    for (let i = 0; i < take && i < candidates.length; i++) {
      const t = candidates[(dayNumber - 1 + i) % candidates.length];
      const isAccessory = t.pattern === "core" || t.pattern === "conditioning";
      exercises.push({
        name: t.name,
        targetMuscles: t.targetMuscles,
        sets: isAccessory ? 3 : rx.sets,
        reps: isAccessory ? "30-45s" : rx.reps,
        restSeconds: isAccessory ? 30 : rx.restSeconds,
        equipment: pickEquipment(t, available),
        rpe: isAccessory ? undefined : rx.rpe,
        cue: t.cue,
      });
    }
  }

  const estimated = Math.min(
    input.sessionLengthMinutes ?? 60,
    20 + exercises.length * Math.round((rx.restSeconds + 60) / 12),
  );

  return {
    dayNumber,
    title: blueprint.title,
    focus: blueprint.focus,
    estimatedDurationMinutes: Math.max(20, estimated),
    warmup: [
      "5 min easy cardio to raise core temperature",
      "Dynamic mobility for the day's primary joints",
      "2 light ramp-up sets on the first compound lift",
    ],
    exercises,
    rationale: dayRationale(blueprint, input),
  };
}

function dayRationale(blueprint: DayBlueprint, input: GeneratePlanInput): string {
  return (
    `${blueprint.title} groups ${blueprint.focus.join(", ").toLowerCase()} so those muscles share ` +
    `recovery and you can train them hard without colliding with the rest of your ` +
    `${input.daysPerWeek}-day week. The compound lifts lead while you're freshest; ` +
    `accessory and core work close out the session.`
  );
}

function progressionFor(goal: Goal, level: Level): Progression {
  if (goal === "strength") {
    return {
      strategy: "Linear progression",
      description:
        "Add a small amount of load to the main lifts each week while keeping reps fixed, as long as bar speed and technique hold.",
      weeklyAdjustments: [
        "Weeks 1-3: add ~2.5kg to each main lift weekly.",
        "Keep accessory work at the same load; chase clean reps.",
        "If a lift stalls twice, hold the weight and bank the reps before adding load again.",
      ],
      deloadGuidance:
        "Every 4th week, cut working sets by ~40% to absorb the training and resensitize.",
    };
  }
  const beginner = level === "beginner";
  return {
    strategy: "Double progression",
    description:
      "Work within the prescribed rep range. When you hit the TOP of the range on every set, add load and drop back to the bottom of the range.",
    weeklyAdjustments: [
      "Stay in the listed rep range and add 1 rep per set week over week when you can.",
      "Once you reach the top of the range on all sets, increase the load next session.",
      beginner
        ? "Prioritise consistent, clean technique over chasing numbers early."
        : "Push the last set close to failure (1-2 reps in reserve).",
    ],
    deloadGuidance:
      "Take a lighter week roughly every 5-6 weeks, or whenever performance dips two sessions running.",
  };
}

export function mockPlan(input: GeneratePlanInput): WorkoutPlan {
  const blueprints = splitFor(input.daysPerWeek);
  const rx = prescriptionFor(input.goal, input.experienceLevel);
  const days = blueprints.map((bp, i) => buildDay(bp, i + 1, input, rx));

  return {
    title: `${LEVEL_LABELS[input.experienceLevel]} ${GOAL_LABELS[input.goal]} — ${input.daysPerWeek}-Day Split`,
    summary: `A ${input.daysPerWeek}-day-per-week ${GOAL_LABELS[input.goal].toLowerCase()} plan built around the equipment you have.`,
    goal: input.goal,
    experienceLevel: input.experienceLevel,
    daysPerWeek: input.daysPerWeek,
    rationale:
      `With ${input.daysPerWeek} day(s) a week, this split balances stimulus and recovery for a ` +
      `${LEVEL_LABELS[input.experienceLevel].toLowerCase()} lifter chasing ${GOAL_LABELS[input.goal].toLowerCase()}. ` +
      `Sets, reps, and rest are set to the ${GOAL_LABELS[input.goal].toLowerCase()} end of the spectrum, ` +
      `and every movement is one you can perform with your available equipment.`,
    days,
    progression: progressionFor(input.goal, input.experienceLevel),
  };
}
