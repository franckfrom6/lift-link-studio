// Re-export all types from domain-specific files for backwards compatibility
export type { Exercise } from "./exercise";
export { MUSCLE_GROUPS, EQUIPMENT_TYPES } from "./exercise";

export type {
  ProgressionPhaseData,
  ProgramData,
  WeekData,
  SessionSectionData,
  SessionData,
  SessionExerciseData,
} from "./program";

export interface MockStudent {
  id: string;
  name: string;
  avatar: string;
  goal: string;
  level: string;
  status: "active" | "inactive";
}

export const DAY_NAMES: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

export const MOCK_STUDENTS: MockStudent[] = [
  { id: "yana", name: "Yana", avatar: "Y", goal: "Hypertrophie fessiers", level: "Avancée", status: "active" },
  { id: "s1", name: "Thomas Martin", avatar: "T", goal: "Prise de masse", level: "Intermédiaire", status: "active" },
  { id: "s2", name: "Julie Dupont", avatar: "J", goal: "Remise en forme", level: "Débutant", status: "active" },
  { id: "s3", name: "Karim Bensaid", avatar: "K", goal: "Performance", level: "Avancé", status: "active" },
  { id: "s4", name: "Emma Leroy", avatar: "E", goal: "Sèche", level: "Intermédiaire", status: "inactive" },
];
