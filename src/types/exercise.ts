import { Database } from "@/integrations/supabase/types";

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

// DB keys (English) used for queries and storage
export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "glutes",
  "abs",
];

export const EQUIPMENT_TYPES = [
  "barbell",
  "dumbbells",
  "machine",
  "cable",
  "bodyweight",
];

// Mapping from old French DB values to new English keys (backwards compatibility)
export const MUSCLE_GROUP_DB_MAP: Record<string, string> = {
  "Pectoraux": "chest",
  "Dos": "back",
  "Épaules": "shoulders",
  "Bras": "arms",
  "Jambes": "legs",
  "Fessiers": "glutes",
  "Abdos": "abs",
  // English keys map to themselves
  "chest": "chest",
  "back": "back",
  "shoulders": "shoulders",
  "arms": "arms",
  "legs": "legs",
  "glutes": "glutes",
  "abs": "abs",
};

export const EQUIPMENT_DB_MAP: Record<string, string> = {
  "Barre": "barbell",
  "Haltères": "dumbbells",
  "Machine": "machine",
  "Câble": "cable",
  "Poids du corps": "bodyweight",
  // English keys map to themselves
  "barbell": "barbell",
  "dumbbells": "dumbbells",
  "machine": "machine",
  "cable": "cable",
  "bodyweight": "bodyweight",
};
