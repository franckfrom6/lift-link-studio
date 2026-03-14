import i18n from "@/i18n";
import { MUSCLE_GROUP_DB_MAP, EQUIPMENT_DB_MAP } from "@/types/exercise";

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
 * Handles both old French DB values and new English keys.
 */
export const getMuscleGroupLabel = (dbValue: string): string => {
  // Normalize to English key (handles both French and English input)
  const key = MUSCLE_GROUP_DB_MAP[dbValue] || dbValue;
  return i18n.t(`exercises:muscle_groups.${key}`, { defaultValue: dbValue });
};

/**
 * Returns the translated equipment label.
 * Handles both old French DB values and new English keys.
 */
export const getEquipmentLabel = (dbValue: string): string => {
  // Normalize to English key (handles both French and English input)
  const key = EQUIPMENT_DB_MAP[dbValue] || dbValue;
  return i18n.t(`exercises:equipment.${key}`, { defaultValue: dbValue });
};
