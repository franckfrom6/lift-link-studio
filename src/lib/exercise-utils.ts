import i18n from "@/i18n";

// Mapping FR muscle group → i18n key
const MUSCLE_GROUP_MAP: Record<string, string> = {
  "Abdos": "abs",
  "Bras": "arms",
  "Dos": "back",
  "Épaules": "shoulders",
  "Fessiers": "glutes",
  "Jambes": "legs",
  "Pectoraux": "chest",
};

const EQUIPMENT_MAP: Record<string, string> = {
  "Poids du corps": "bodyweight",
  "Haltères": "dumbbells",
  "Barre": "barbell",
  "Câble": "cable",
  "Machine": "machine",
};

/**
 * Returns the exercise name in the current language.
 * Falls back to `name` (FR) if no `name_en` is available.
 */
export const getExerciseName = (exercise: { name: string; name_en?: string | null }): string => {
  if (i18n.language === "en" && exercise.name_en) {
    return exercise.name_en;
  }
  return exercise.name;
};

/**
 * Returns the translated muscle group label.
 */
export const getMuscleGroupLabel = (muscleGroupFr: string): string => {
  const key = MUSCLE_GROUP_MAP[muscleGroupFr];
  if (key && i18n.language === "en") {
    return i18n.t(`exercises:muscle_groups.${key}`);
  }
  return muscleGroupFr;
};

/**
 * Returns the translated equipment label.
 */
export const getEquipmentLabel = (equipmentFr: string): string => {
  const key = EQUIPMENT_MAP[equipmentFr];
  if (key && i18n.language === "en") {
    return i18n.t(`exercises:equipment.${key}`);
  }
  return equipmentFr;
};
