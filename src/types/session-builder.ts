export type MuscleTarget = 
  | "push" | "pull" | "legs" | "full_body" | "core" | "cardio"
  // Advanced muscle groups
  | "chest" | "back" | "shoulders" | "biceps" | "triceps" 
  | "quads" | "hamstrings" | "glutes" | "calves" | "abs";

export type EquipmentOption = 
  | "dumbbells" | "barbell" | "machine" | "cable" 
  | "bodyweight" | "kettlebell" | "resistance_band" | "mini_band"
  | "fitness_ball" | "yoga_block" | "trx" | "bosu" | "step";

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
  "bodyweight", "kettlebell", "resistance_band", "mini_band",
  "fitness_ball", "yoga_block", "trx", "bosu", "step",
];

// Map pattern targets to DB muscle groups for filtering
// Now uses English DB keys (matching updated exercises table)
export const TARGET_TO_MUSCLE_GROUPS: Record<string, string[]> = {
  push: ["chest", "shoulders", "arms"],
  pull: ["back", "arms"],
  legs: ["legs", "glutes"],
  full_body: ["chest", "back", "shoulders", "arms", "legs", "glutes", "abs"],
  core: ["abs"],
  cardio: [],
  chest: ["chest"],
  back: ["back"],
  shoulders: ["shoulders"],
  biceps: ["arms"],
  triceps: ["arms"],
  quads: ["legs"],
  hamstrings: ["legs"],
  glutes: ["glutes"],
  calves: ["legs"],
  abs: ["abs"],
};

// Map equipment options to DB equipment values (now English)
export const EQUIPMENT_TO_DB: Record<EquipmentOption, string> = {
  dumbbells: "dumbbells",
  barbell: "barbell",
  machine: "machine",
  cable: "cable",
  bodyweight: "bodyweight",
  kettlebell: "kettlebell",
  resistance_band: "resistance_band",
  mini_band: "mini_band",
  fitness_ball: "fitness_ball",
  yoga_block: "yoga_block",
  trx: "trx",
  bosu: "bosu",
  step: "step",
};
