/**
 * Session categorization utilities for the monthly calendar filters.
 *
 * Two filter axes:
 *  - Focus musculaire: derived from exercise.muscle_group on programmed/free sessions.
 *  - Famille de sport: derived from external_sessions.activity_type.
 *
 * Both axes share a single string key (prefixed) so the filter can mix them
 * in one dropdown while staying unambiguous.
 */

export type FocusKey =
  | "focus:upper"
  | "focus:lower"
  | "focus:core"
  | "focus:full"
  | "focus:cardio";

export type SportKey =
  | "sport:strength"
  | "sport:running"
  | "sport:cycling"
  | "sport:swimming"
  | "sport:team"
  | "sport:combat"
  | "sport:mobility"
  | "sport:other";

export type CategoryKey = FocusKey | SportKey;

export const FOCUS_LABELS: Record<FocusKey, string> = {
  "focus:upper": "Haut du corps",
  "focus:lower": "Bas du corps",
  "focus:core": "Tronc / Core",
  "focus:full": "Full body",
  "focus:cardio": "Cardio",
};

export const SPORT_LABELS: Record<SportKey, string> = {
  "sport:strength": "Musculation",
  "sport:running": "Course / Trail",
  "sport:cycling": "Cyclisme",
  "sport:swimming": "Natation",
  "sport:team": "Sports collectifs",
  "sport:combat": "Combat / Arts martiaux",
  "sport:mobility": "Mobilité / Yoga",
  "sport:other": "Autre sport",
};

/**
 * Normalize a muscle_group value (DB has both FR and legacy EN values).
 * Returns the focus bucket the muscle belongs to.
 */
function muscleToFocus(raw: string): FocusKey | null {
  const m = raw.trim().toLowerCase();
  // Upper body
  if (
    [
      "pectoraux", "chest",
      "dos", "back",
      "épaules", "epaules", "shoulders",
      "biceps", "triceps", "arms", "bras",
      "trapèzes", "trapezes", "traps",
      "avant-bras", "forearms",
    ].includes(m)
  ) return "focus:upper";

  // Lower body
  if (
    [
      "jambes", "legs",
      "quadriceps", "quads",
      "ischios", "ischio-jambiers", "hamstrings",
      "fessiers", "glutes",
      "mollets", "calves",
      "adducteurs", "adductors",
    ].includes(m)
  ) return "focus:lower";

  // Core
  if (["abdominaux", "abs", "core", "lombaires", "obliques"].includes(m)) {
    return "focus:core";
  }

  // Cardio (treated as a focus)
  if (["cardio"].includes(m)) return "focus:cardio";

  // Full body
  if (["full body", "fullbody", "full-body"].includes(m)) return "focus:full";

  return null;
}

/**
 * Compute the set of focus categories for a list of muscle groups.
 * If the session covers BOTH upper and lower, also adds "focus:full".
 */
export function computeFocusCategories(muscles: Iterable<string>): Set<FocusKey> {
  const out = new Set<FocusKey>();
  for (const m of muscles) {
    const f = muscleToFocus(m);
    if (f) out.add(f);
  }
  if (out.has("focus:upper") && out.has("focus:lower")) {
    out.add("focus:full");
  }
  return out;
}

/** Map an external activity_type (raw DB value) to a sport family. */
export function activityTypeToSport(raw: string | null | undefined): SportKey {
  if (!raw) return "sport:other";
  const a = raw.trim().toLowerCase();
  if (["running", "trail", "jogging", "course", "marathon"].includes(a)) return "sport:running";
  if (["cycling", "bike", "vélo", "velo", "vtt", "biking"].includes(a)) return "sport:cycling";
  if (["swimming", "natation", "swim"].includes(a)) return "sport:swimming";
  if (["football", "rugby", "basketball", "basket", "handball", "volleyball", "volley", "soccer"].includes(a)) return "sport:team";
  if (["boxing", "boxe", "mma", "judo", "karate", "karaté", "bjj", "jiu-jitsu", "muay thai", "muaythai"].includes(a)) return "sport:combat";
  if (["yoga", "pilates", "stretching", "mobility", "mobilité", "mobilite"].includes(a)) return "sport:mobility";
  if (["strength", "musculation", "weightlifting", "crossfit", "hiit", "hyrox"].includes(a)) return "sport:strength";
  return "sport:other";
}

/** Human label for any category key. */
export function categoryLabel(key: CategoryKey): string {
  if (key.startsWith("focus:")) return FOCUS_LABELS[key as FocusKey];
  return SPORT_LABELS[key as SportKey];
}