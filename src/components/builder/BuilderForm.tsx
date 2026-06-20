"use client";

import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Field } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stepper } from "@/components/ui/Stepper";
import { EQUIPMENT_LABELS, GOAL_LABELS, LEVEL_LABELS } from "@/lib/ai/labels";
import {
  EQUIPMENT,
  type Equipment,
  type GeneratePlanInput,
  GOALS,
  type Goal,
  generatePlanInputSchema,
  LEVELS,
  type Level,
} from "@/lib/ai/schema";

const GOAL_OPTIONS = GOALS.map((value) => ({ value, label: GOAL_LABELS[value] }));
const LEVEL_OPTIONS = LEVELS.map((value) => ({ value, label: LEVEL_LABELS[value] }));
const EQUIPMENT_OPTIONS = EQUIPMENT.map((value) => ({ value, label: EQUIPMENT_LABELS[value] }));
const SESSION_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
] as const;

interface BuilderFormProps {
  onSubmit: (input: GeneratePlanInput) => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export function BuilderForm({ onSubmit, isSubmitting = false, submitError }: BuilderFormProps) {
  const equipmentId = useId();
  const notesId = useId();

  const [goal, setGoal] = useState<Goal>("hypertrophy");
  const [level, setLevel] = useState<Level>("beginner");
  const [days, setDays] = useState(3);
  const [equipment, setEquipment] = useState<Equipment[]>(["full_gym"]);
  const [session, setSession] = useState<(typeof SESSION_OPTIONS)[number]["value"]>("any");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleEquipment(value: Equipment) {
    setEquipment((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value],
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const candidate = {
      goal,
      experienceLevel: level,
      daysPerWeek: days,
      availableEquipment: equipment,
      sessionLengthMinutes: session === "any" ? undefined : Number(session),
      notes: notes.trim() ? notes.trim() : undefined,
    };

    const parsed = generatePlanInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0]?.toString() ?? "form"] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10" noValidate>
      <Field label="Primary Goal" asFieldset>
        <SegmentedControl name="goal" options={GOAL_OPTIONS} value={goal} onChange={setGoal} />
      </Field>

      <Field label="Experience Level" asFieldset>
        <SegmentedControl name="level" options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
      </Field>

      <Field label="Training Days / Week" asFieldset>
        <Stepper
          value={days}
          min={1}
          max={7}
          onChange={setDays}
          unit="days"
          aria-label="Training days per week"
        />
      </Field>

      <Field
        label="Available Equipment"
        asFieldset
        htmlFor={equipmentId}
        error={errors.availableEquipment}
        hint="Pick everything you can train with. Bodyweight is always an option."
      >
        <ChipGroup options={EQUIPMENT_OPTIONS} selected={equipment} onToggle={toggleEquipment} />
      </Field>

      <Field label="Session Length" asFieldset>
        <SegmentedControl
          name="session"
          options={SESSION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={session}
          onChange={setSession}
        />
      </Field>

      <Field
        label="Notes (optional)"
        htmlFor={notesId}
        hint="Injuries, preferences, anything to factor in."
      >
        <textarea
          id={notesId}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="e.g. dodgy left shoulder, prefer free weights…"
          className="w-full resize-y rounded-[var(--radius-sharp)] border-2 border-line bg-surface px-4 py-3 font-sans text-sm text-bone placeholder:text-bone-dim/60 focus-visible:border-volt"
        />
      </Field>

      {submitError ? (
        <p
          role="alert"
          className="rounded-[var(--radius-sharp)] border-2 border-danger bg-danger/10 px-4 py-3 font-mono text-sm text-danger shadow-[4px_4px_0_0_var(--color-danger)]"
        >
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="self-start text-base">
        {isSubmitting ? "Generating…" : "Generate Plan →"}
      </Button>
    </form>
  );
}
