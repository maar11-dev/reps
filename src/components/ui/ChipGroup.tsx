import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
}

/**
 * Multi-select chips. Each chip is a toggle <button> with `aria-pressed` so its
 * state is announced. Used for equipment selection.
 */
export function ChipGroup<T extends string>({ options, selected, onToggle }: ChipGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isOn = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(option.value)}
            className={cn(
              "press rounded-[var(--radius-sharp)] border-2 px-4 py-2.5",
              "font-mono text-sm uppercase tracking-wide",
              isOn
                ? "border-volt bg-volt/10 text-volt shadow-[3px_3px_0_0_var(--color-volt)]"
                : "border-line bg-surface text-bone hover:border-volt hover:text-volt",
            )}
          >
            <span aria-hidden="true" className="mr-2 font-bold">
              {isOn ? "✓" : "+"}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
