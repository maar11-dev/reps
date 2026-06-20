import { formatRest } from "@/lib/ai/labels";
import type { Exercise, WorkoutDay } from "@/lib/ai/schema";
import { cn } from "@/lib/utils";

interface DayCardProps {
  day: WorkoutDay;
  /** When provided, each exercise shows a "Swap" control. `position` is 0-based. */
  onSwap?: (dayNumber: number, position: number, exercise: Exercise) => void;
  /** `${dayNumber}:${position}` of the exercise currently being swapped, if any. */
  swappingKey?: string | null;
}

export function DayCard({ day, onSwap, swappingKey }: DayCardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <p className="kicker text-volt">Day {String(day.dayNumber).padStart(2, "0")}</p>
          <h3 className="display text-3xl text-bone sm:text-4xl">{day.title}</h3>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-bone-dim">
          ~{day.estimatedDurationMinutes} min · {day.focus.join(" / ")}
        </p>
      </div>

      <div className="rounded-[var(--radius-sharp)] border border-line bg-surface/50 p-4">
        <p className="kicker text-bone-dim mb-2">Why this day</p>
        <p className="text-sm leading-relaxed text-bone">{day.rationale}</p>
      </div>

      {day.warmup.length > 0 ? (
        <div>
          <p className="kicker text-bone-dim mb-2">Warm-up</p>
          <ul className="flex flex-col gap-1">
            {day.warmup.map((step) => (
              <li key={step} className="flex gap-3 text-sm text-bone-dim">
                <span aria-hidden="true" className="text-volt">
                  ›
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="flex flex-col divide-y divide-line border-y border-line">
        {day.exercises.map((exercise, index) => (
          <ExerciseRow
            key={`${exercise.name}-${exercise.sets}x${exercise.reps}`}
            exercise={exercise}
            index={index + 1}
            onSwap={onSwap ? () => onSwap(day.dayNumber, index, exercise) : undefined}
            isSwapping={swappingKey === `${day.dayNumber}:${index}`}
          />
        ))}
      </ol>
    </div>
  );
}

interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  onSwap?: () => void;
  isSwapping?: boolean;
}

function ExerciseRow({ exercise, index, onSwap, isSwapping }: ExerciseRowProps) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex gap-4">
        <span className="display tabular text-2xl text-line leading-none" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex flex-col gap-1">
          <span className="font-sans text-base font-semibold text-bone">{exercise.name}</span>
          <span className="text-xs text-bone-dim">{exercise.targetMuscles.join(", ")}</span>
          {exercise.cue ? (
            <span className="text-xs italic text-bone-dim/80">“{exercise.cue}”</span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-5 sm:gap-6">
        <dl className="flex gap-5 font-mono tabular sm:gap-6">
          <Metric label="Sets×Reps" value={`${exercise.sets}×${exercise.reps}`} />
          <Metric label="Rest" value={formatRest(exercise.restSeconds)} />
          {exercise.rpe ? <Metric label="Intensity" value={exercise.rpe} /> : null}
        </dl>

        {onSwap ? (
          <button
            type="button"
            onClick={onSwap}
            disabled={isSwapping}
            aria-busy={isSwapping}
            aria-label={`Swap ${exercise.name} for an equivalent exercise`}
            className={cn(
              "inline-flex items-center gap-1.5 self-center rounded-[var(--radius-sharp)] border px-3 py-2",
              "font-mono text-[0.65rem] uppercase tracking-[0.15em] transition-colors",
              "border-line text-bone-dim hover:border-volt hover:text-volt",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line disabled:hover:text-bone-dim",
            )}
          >
            <span aria-hidden="true">⇄</span>
            {isSwapping ? "Swapping…" : "Swap"}
          </button>
        ) : null}
      </div>
    </li>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[0.6rem] uppercase tracking-widest text-bone-dim">{label}</dt>
      <dd className="text-lg text-volt">{value}</dd>
    </div>
  );
}
