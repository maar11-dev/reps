import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  unit?: string;
  "aria-label": string;
}

/**
 * Numeric stepper (e.g. training days per week). The two buttons adjust the
 * value; the value itself is an aria-live region so changes are announced.
 */
export function Stepper({ value, min, max, onChange, unit, ...rest }: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    // biome-ignore lint/a11y/useSemanticElements: a labelled group of stepper buttons; a fieldset would be redundant inside the parent Field's fieldset
    <div
      className="inline-flex items-stretch rounded-[var(--radius-sharp)] border-2 border-line bg-surface shadow-[4px_4px_0_0_var(--color-line)]"
      role="group"
      aria-label={rest["aria-label"]}
    >
      <StepButton
        label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </StepButton>
      <div className="flex min-w-24 items-baseline justify-center gap-1.5 border-x-2 border-line px-5">
        <span aria-live="polite" className="display tabular text-4xl text-volt leading-none py-2">
          {value}
        </span>
        {unit ? <span className="font-mono text-xs uppercase text-bone-dim">{unit}</span> : null}
      </div>
      <StepButton
        label="Increase"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-12 items-center justify-center font-mono text-2xl leading-none",
        "text-bone transition-colors hover:text-volt disabled:text-line disabled:hover:text-line",
      )}
    >
      {children}
    </button>
  );
}
