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
              "rounded-[var(--radius-sharp)] border px-4 py-2.5",
              "font-sans text-sm transition-colors duration-150",
              isOn
                ? "border-volt bg-volt/10 text-volt"
                : "border-line bg-surface text-bone hover:border-bone-dim",
            )}
          >
            <span aria-hidden="true" className="mr-2 font-mono">
              {isOn ? "✓" : "+"}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
