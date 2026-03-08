// Activity types with icons, labels, and default muscle groups
export interface ActivityType {
  id: string;
  label: string;
  emoji: string;
  defaultMuscleGroups: string[];
  defaultDuration: number;
}

export const ACTIVITY_TYPES: ActivityType[] = [
  { id: "pilates", label: "Pilates", emoji: "🧘", defaultMuscleGroups: ["core", "glutes", "flexibility"], defaultDuration: 60 },
  { id: "hiit", label: "HIIT", emoji: "⚡", defaultMuscleGroups: ["cardio", "full-body"], defaultDuration: 45 },
  { id: "cycling", label: "Cycling", emoji: "🚴", defaultMuscleGroups: ["quads", "cardio"], defaultDuration: 45 },
  { id: "running", label: "Running", emoji: "🏃", defaultMuscleGroups: ["cardio", "legs"], defaultDuration: 45 },
  { id: "bootcamp", label: "Bootcamp", emoji: "💪", defaultMuscleGroups: ["full-body", "cardio"], defaultDuration: 60 },
  { id: "swimming", label: "Swimming", emoji: "🏊", defaultMuscleGroups: ["cardio", "back", "shoulders"], defaultDuration: 60 },
  { id: "yoga", label: "Yoga", emoji: "🧘", defaultMuscleGroups: ["flexibility", "core"], defaultDuration: 60 },
  { id: "boxing", label: "Boxing", emoji: "🥊", defaultMuscleGroups: ["cardio", "arms", "core"], defaultDuration: 60 },
  { id: "other", label: "Autre", emoji: "➕", defaultMuscleGroups: [], defaultDuration: 60 },
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
