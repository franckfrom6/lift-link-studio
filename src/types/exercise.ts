import { Database } from "@/integrations/supabase/types";

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

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
