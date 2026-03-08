import { Database } from "@/integrations/supabase/types";

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export interface MockStudent {
  id: string;
  name: string;
  avatar: string;
  goal: string;
  level: string;
  status: "active" | "inactive";
}

export interface ProgramData {
  id: string;
  name: string;
  studentId: string;
  status: "draft" | "active" | "completed";
  weeks: WeekData[];
}

export interface WeekData {
  id: string;
  weekNumber: number;
  sessions: SessionData[];
}

export interface SessionData {
  id: string;
  dayOfWeek: number;
  name: string;
  notes?: string;
  exercises: SessionExerciseData[];
}

export interface SessionExerciseData {
  id: string;
  exercise: Exercise;
  sortOrder: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  suggestedWeight?: number;
  coachNotes?: string;
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

export const MUSCLE_GROUPS = [
  "Pectoraux",
  "Dos",
  "Épaules",
  "Bras",
  "Jambes",
  "Fessiers",
  "Abdos",
];

export const EQUIPMENT_TYPES = [
  "Barre",
  "Haltères",
  "Machine",
  "Câble",
  "Poids du corps",
];

export const MOCK_STUDENTS: MockStudent[] = [
  { id: "yana", name: "Yana", avatar: "Y", goal: "Hypertrophie fessiers", level: "Avancée", status: "active" },
  { id: "s1", name: "Thomas Martin", avatar: "T", goal: "Prise de masse", level: "Intermédiaire", status: "active" },
  { id: "s2", name: "Julie Dupont", avatar: "J", goal: "Remise en forme", level: "Débutant", status: "active" },
  { id: "s3", name: "Karim Bensaid", avatar: "K", goal: "Performance", level: "Avancé", status: "active" },
  { id: "s4", name: "Emma Leroy", avatar: "E", goal: "Sèche", level: "Intermédiaire", status: "inactive" },
];
