// Activity types with icons, labels, and default muscle groups
export type ActivityDiscipline = "endurance" | "strength" | "flexibility" | "mixed";

export interface ActivityType {
  id: string;
  label: string;
  emoji: string;
  defaultMuscleGroups: string[];
  defaultDuration: number;
  discipline: ActivityDiscipline;
}

export const ACTIVITY_TYPES: ActivityType[] = [
  { id: "pilates", label: "Pilates", emoji: "🧘", defaultMuscleGroups: [], defaultDuration: 60, discipline: "flexibility" },
  { id: "hiit", label: "HIIT", emoji: "⚡", defaultMuscleGroups: ["full-body"], defaultDuration: 45, discipline: "mixed" },
  { id: "cycling", label: "Cycling", emoji: "🚴", defaultMuscleGroups: [], defaultDuration: 45, discipline: "endurance" },
  { id: "running", label: "Running", emoji: "🏃", defaultMuscleGroups: [], defaultDuration: 45, discipline: "endurance" },
  { id: "bootcamp", label: "Bootcamp", emoji: "💪", defaultMuscleGroups: ["full-body"], defaultDuration: 60, discipline: "mixed" },
  { id: "swimming", label: "Swimming", emoji: "🏊", defaultMuscleGroups: [], defaultDuration: 60, discipline: "endurance" },
  { id: "yoga", label: "Yoga", emoji: "🧘", defaultMuscleGroups: [], defaultDuration: 60, discipline: "flexibility" },
  { id: "boxing", label: "Boxing", emoji: "🥊", defaultMuscleGroups: [], defaultDuration: 60, discipline: "mixed" },
  { id: "other", label: "Autre", emoji: "➕", defaultMuscleGroups: [], defaultDuration: 60, discipline: "mixed" },
];

export const MUSCLE_GROUP_OPTIONS = [
  "cardio", "quads", "glutes", "ischios", "core", "back", "shoulders",
  "arms", "chest", "legs", "full-body", "flexibility",
];

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  cardio: "Cardio", quads: "Quadriceps", glutes: "Fessiers", ischios: "Ischios",
  core: "Core", back: "Dos", shoulders: "Épaules", arms: "Bras",
  chest: "Poitrine", legs: "Jambes", "full-body": "Full Body", flexibility: "Souplesse",
};

export const DEFAULT_PROVIDERS = ["Episod", "CMG", "Keepcool", "Basic Fit", "Indépendant"];

/** Resolve discipline for a given activity_type id (defaults to mixed). */
export const getActivityDiscipline = (activityTypeId: string | null | undefined): ActivityDiscipline => {
  if (!activityTypeId) return "mixed";
  return ACTIVITY_TYPES.find((t) => t.id === activityTypeId)?.discipline ?? "mixed";
};

/** True for cardio/endurance disciplines (running, cycling, swimming...). */
export const isEnduranceActivity = (activityTypeId: string | null | undefined): boolean =>
  getActivityDiscipline(activityTypeId) === "endurance";

export const INTENSITY_LABELS: Record<number, string> = {
  1: "Très léger", 2: "Léger", 3: "Light",
  4: "Modéré", 5: "Modéré", 6: "Modéré+",
  7: "Intense", 8: "Intense",
  9: "Max", 10: "Max",
};

export const getIntensityColor = (value: number): string => {
  if (value <= 3) return "text-success";
  if (value <= 6) return "text-warning";
  if (value <= 8) return "text-orange-500";
  return "text-destructive";
};
