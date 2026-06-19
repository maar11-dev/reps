import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Single-select control built on native radio inputs (visually hidden) so it is
 * keyboard- and screen-reader-accessible for free. Wrap it in a <Field
 * asFieldset> for a group label.
 */
export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "cursor-pointer select-none rounded-[var(--radius-sharp)] border px-4 py-2.5",
              "font-sans text-sm transition-colors duration-150",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-volt has-[:focus-visible]:outline-offset-2",
              checked
                ? "border-volt bg-volt text-volt-ink font-semibold"
                : "border-line bg-surface text-bone hover:border-bone-dim",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
