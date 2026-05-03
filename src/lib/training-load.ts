import { getActivityDiscipline } from "@/data/activity-types";

/**
 * Lightweight session shape used by `computeSessionLoad`. Mirrors the
 * subset of `external_sessions` columns we need without coupling to the
 * Supabase generated types.
 */
export interface SessionLoadInput {
  /** Activity type id (e.g. "running", "cycling") for discipline lookup. */
  activity_type?: string | null;
  /** Session duration in minutes. */
  duration_minutes?: number | null;
  /** Perceived exertion 1–10 (RPE). */
  intensity_perceived?: number | null;
  /** Average heart rate in bpm (endurance). */
  avg_hr?: number | null;
  /** Athlete max heart rate (theoretical or measured). */
  max_hr?: number | null;
  /** Optional age — used to derive 220 - age when max_hr is unknown. */
  age?: number | null;
}

/**
 * Returns a unified training-load score so strength and endurance
 * sessions can sit in the same weekly chart.
 *
 *  - strength       → duration * RPE              (0–~1000)
 *  - endurance + HR → duration * (avg_hr/max_hr) * 100  (TRIMP-lite)
 *  - endurance + RPE → duration * RPE             (fallback)
 *  - flexibility    → duration * 0.3              (very low load)
 *  - mixed          → duration * RPE              (treat as strength-like)
 *
 * Always returns a non-negative integer; 0 when inputs are missing.
 */
export function computeSessionLoad(input: SessionLoadInput): number {
  const duration = input.duration_minutes ?? 0;
  if (duration <= 0) return 0;

  const discipline = getActivityDiscipline(input.activity_type ?? undefined);
  const rpe = Math.max(0, Math.min(10, input.intensity_perceived ?? 0));

  if (discipline === "flexibility") {
    return Math.round(duration * 0.3);
  }

  if (discipline === "endurance") {
    const avg = input.avg_hr ?? 0;
    const max = input.max_hr ?? (input.age ? 220 - input.age : 180);
    if (avg > 0 && max > 0) {
      return Math.round(duration * (avg / max) * 100);
    }
    if (rpe > 0) {
      return Math.round(duration * rpe);
    }
    return Math.round(duration * 5); // unknown-effort fallback
  }

  // strength + mixed
  if (rpe > 0) return Math.round(duration * rpe);
  return Math.round(duration * 5);
}
