/**
 * App-wide constants. Isomorphic — safe to import anywhere.
 */

/**
 * Non-medical disclaimer. Rendered (verbatim) with every generated plan.
 * Kept as a UI constant rather than model-generated so the wording is reviewed
 * and stable — the model never invents medical claims. Required by CLAUDE.md.
 */
export const NON_MEDICAL_DISCLAIMER =
  "Reps generates general fitness suggestions, not medical or professional training advice. " +
  "Consult a qualified physician or coach before starting any program, especially if you have " +
  "an injury or health condition. Stop and seek help if you feel pain, dizziness, or distress.";

export const APP_NAME = "Reps";
export const APP_TAGLINE = "Your goals, your gear, one structured plan.";
