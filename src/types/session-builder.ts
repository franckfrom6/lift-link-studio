export type MuscleTarget = 
  | "push" | "pull" | "legs" | "full_body" | "core" | "cardio"
  // Advanced muscle groups
  | "chest" | "back" | "shoulders" | "biceps" | "triceps" 
  | "quads" | "hamstrings" | "glutes" | "calves" | "abs";

export type EquipmentOption = 
  | "dumbbells" | "barbell" | "machine" | "cable" 
  | "bodyweight" | "kettlebell" | "bands" | "trx";

export interface LiveExercise {
  id: string; // local UUID
  exerciseId: string; // DB exercise ID
  name: string;
  nameEn?: string | null;
  muscleGroup: string;
  equipment: string;
  type: string; // compound | isolation
  trackingType: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  weightEnabled: boolean;
  weightKg?: number;
  tempo?: string;
  rpeTarget?: string;
  note?: string;
  order: number;
}

export interface SessionBuilderState {
  targetDuration: number;
  targets: MuscleTarget[];
  equipment: EquipmentOption[];
  exercises: LiveExercise[];
  sessionName: string;
}

export const DURATION_PRESETS = [20, 30, 45, 60, 75, 90];

export const PATTERN_TARGETS: MuscleTarget[] = [
  "push", "pull", "legs", "full_body", "core", "cardio",
];

export const ADVANCED_TARGETS: MuscleTarget[] = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "calves", "abs",
];

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  "dumbbells", "barbell", "machine", "cable", 
  "bodyweight", "kettlebell", "bands", "trx",
];

// Map pattern targets to DB muscle groups for filtering
export const TARGET_TO_MUSCLE_GROUPS: Record<string, string[]> = {
  push: ["Pectoraux", "Épaules", "Bras"],
  pull: ["Dos", "Bras"],
  legs: ["Jambes", "Fessiers"],
  full_body: ["Pectoraux", "Dos", "Épaules", "Bras", "Jambes", "Fessiers", "Abdos"],
  core: ["Abdos"],
  cardio: [],
  chest: ["Pectoraux"],
  back: ["Dos"],
  shoulders: ["Épaules"],
  biceps: ["Bras"],
  triceps: ["Bras"],
  quads: ["Jambes"],
  hamstrings: ["Jambes"],
  glutes: ["Fessiers"],
  calves: ["Jambes"],
  abs: ["Abdos"],
};

// Map equipment options to DB equipment values
export const EQUIPMENT_TO_DB: Record<EquipmentOption, string> = {
  dumbbells: "Haltères",
  barbell: "Barre",
  machine: "Machine",
  cable: "Câble",
  bodyweight: "Poids du corps",
  kettlebell: "Haltères", // closest match
  bands: "Poids du corps", // closest match
  trx: "Poids du corps", // closest match
};
