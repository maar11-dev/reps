import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  /** Render as a <fieldset>/<legend> instead of <label> (for grouped controls). */
  asFieldset?: boolean;
  children: ReactNode;
}

/**
 * Labelled form field wrapper. Uses a real <label> for single controls and a
 * <fieldset>/<legend> for grouped controls (radios, chips) so screen readers
 * announce the group name.
 */
export function Field({ label, htmlFor, hint, error, asFieldset, children }: FieldProps) {
  const heading = (
    <span className="kicker text-bone-dim flex items-baseline gap-2">
      {label}
      {error ? (
        <span className="text-danger normal-case tracking-normal font-sans">{error}</span>
      ) : null}
    </span>
  );

  const body = (
    <>
      {children}
      {hint ? <p className="text-xs text-bone-dim">{hint}</p> : null}
    </>
  );

  if (asFieldset) {
    return (
      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0">{heading}</legend>
        {body}
      </fieldset>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor}>{heading}</label>
      {body}
    </div>
  );
}
