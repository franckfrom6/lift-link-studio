/** One structured segment inside a running session. */
export interface RunBlock {
  id: string;
  type: RunBlockType;
  label?: string;
  target_km?: number;
  target_min?: number;
  pace_min_s?: number;   // slowest pace in s/km  e.g. 390 = 6:30/km
  pace_max_s?: number;   // fastest pace in s/km  e.g. 360 = 6:00/km
  zone?: 1 | 2 | 3 | 4 | 5;
  repeats?: number;
  work_km?: number;
  work_min?: number;
  recovery_min?: number;
  notes?: string;
}

export type RunBlockType =
  | "warmup"
  | "easy"
  | "tempo"
  | "threshold"
  | "interval"
  | "recovery"
  | "cooldown";

export const RUN_BLOCK_LABELS: Record<RunBlockType, string> = {
  warmup:    "Échauffement",
  easy:      "Footing EF",
  tempo:     "Tempo",
  threshold: "Seuil",
  interval:  "Fractionné",
  recovery:  "Récupération",
  cooldown:  "Retour au calme",
};

export const RUN_BLOCK_COLORS: Record<RunBlockType, string> = {
  warmup:    "bg-blue-500/15 text-blue-600 border-blue-500/25",
  easy:      "bg-success/15 text-success border-success/25",
  tempo:     "bg-yellow-500/15 text-yellow-600 border-yellow-500/25",
  threshold: "bg-orange-500/15 text-orange-600 border-orange-500/25",
  interval:  "bg-destructive/15 text-destructive border-destructive/25",
  recovery:  "bg-muted/30 text-muted-foreground border-border",
  cooldown:  "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export const ZONE_LABELS: Record<number, string> = {
  1: "Z1 · Très facile",
  2: "Z2 · Endurance fondamentale",
  3: "Z3 · Allure tempo",
  4: "Z4 · Seuil lactique",
  5: "Z5 · VO2max",
};

export const ZONE_COLORS: Record<number, string> = {
  1: "text-sky-500",
  2: "text-success",
  3: "text-yellow-500",
  4: "text-orange-500",
  5: "text-destructive",
};

export const RACE_TYPE_LABELS: Record<string, string> = {
  "5k":            "5 km",
  "10k":           "10 km",
  "half_marathon": "Semi-marathon",
  "marathon":      "Marathon",
  "trail_20k":     "Trail 20 km",
  "trail_50k":     "Trail 50 km",
};

/** Format seconds/km as "mm:ss /km" */
export function formatPaceSec(s: number | null | undefined): string {
  if (!s || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60).toString().padStart(2, "0");
  return `${m}:${sec} /km`;
}

/** Compute pace s/km from km + minutes */
export function paceFromKmMin(km: number, minutes: number): number | null {
  if (!km || !minutes || km <= 0 || minutes <= 0) return null;
  return Math.round((minutes * 60) / km);
}

/** Total distance of a run session's blocks in km */
export function totalBlocksKm(blocks: RunBlock[]): number {
  return blocks.reduce((acc, b) => {
    if (b.type === "interval" && b.work_km && b.repeats)
      return acc + b.work_km * b.repeats;
    return acc + (b.target_km || 0);
  }, 0);
}

/** Estimated total duration of a run session in minutes */
export function estimatedBlocksMin(blocks: RunBlock[]): number {
  return blocks.reduce((acc, b) => {
    if (b.type === "interval" && b.repeats) {
      const workMin =
        b.work_min ||
        (b.work_km && b.pace_max_s ? (b.work_km * b.pace_max_s) / 60 : 0);
      const recov = b.recovery_min || 1.5;
      return acc + (workMin + recov) * b.repeats;
    }
    if (b.target_min) return acc + b.target_min;
    if (b.target_km && b.pace_max_s)
      return acc + (b.target_km * b.pace_max_s) / 60;
    return acc;
  }, 0);
}