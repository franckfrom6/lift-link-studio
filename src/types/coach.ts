// Re-export all types from domain-specific files for backwards compatibility
export type { Exercise } from "./exercise";
export { MUSCLE_GROUPS, EQUIPMENT_TYPES, MUSCLE_GROUP_DB_MAP, EQUIPMENT_DB_MAP } from "./exercise";

export type {
  ProgressionPhaseData,
  ProgramData,
  WeekData,
  SessionSectionData,
  SessionData,
  SessionExerciseData,
} from "./program";

export const DAY_NAMES: Record<number, string> = {
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
  7: "sunday",
};
