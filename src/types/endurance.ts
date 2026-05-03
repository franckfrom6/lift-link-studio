/**
 * Endurance metrics — discipline-specific JSON payloads stored in
 * `external_sessions.metrics`. Keep these structures forward-compatible:
 * any field is optional so importers (Strava, Garmin, …) only fill what
 * they have.
 */

export interface RunningSplit {
  km: number;
  pace_s: number; // seconds for this km
  hr_avg?: number;
  elevation?: number;
}

export interface CyclingSplit {
  km: number;
  speed_kmh: number;
  power_w?: number;
  hr_avg?: number;
}

export interface SwimmingLap {
  lap: number;
  time_s: number;
  strokes: number;
}

export interface HrZones {
  z1: number; z2: number; z3: number; z4: number; z5: number; // seconds per zone
}

export interface RunningMetrics {
  splits?: RunningSplit[];
  hr_zones?: HrZones;
  avg_cadence_spm?: number;
  route_polyline?: string;
}

export interface CyclingMetrics {
  splits?: CyclingSplit[];
  hr_zones?: HrZones;
  avg_power_w?: number;
  normalized_power_w?: number;
  route_polyline?: string;
}

export interface SwimmingMetrics {
  pool_length_m?: number;
  total_strokes?: number;
  avg_swolf?: number;
  laps?: SwimmingLap[];
}

export type EnduranceMetrics = RunningMetrics | CyclingMetrics | SwimmingMetrics;

/** Source of the recorded session — used for de-dup and display. */
export type ExternalSessionSource =
  | "manual"
  | "strava"
  | "apple_health"
  | "garmin"
  | "fit_import";

/**
 * Compute pace (seconds per km) from a duration in minutes and a distance
 * in meters. Returns null if any input is missing or non-positive.
 */
export function computePaceSPerKm(
  durationMinutes: number | null | undefined,
  distanceMeters: number | null | undefined
): number | null {
  if (!durationMinutes || !distanceMeters || distanceMeters <= 0) return null;
  const km = distanceMeters / 1000;
  if (km <= 0) return null;
  return Math.round((durationMinutes * 60) / km);
}

/** Format a pace in seconds-per-km as "mm:ss / km". */
export function formatPace(paceSPerKm: number | null | undefined): string {
  if (!paceSPerKm || paceSPerKm <= 0 || !Number.isFinite(paceSPerKm)) return "—";
  const m = Math.floor(paceSPerKm / 60);
  const s = Math.round(paceSPerKm % 60).toString().padStart(2, "0");
  return `${m}:${s} /km`;
}

/**
 * MET-based calorie estimate: kcal ≈ duration_min * MET * 3.5 * weight_kg / 200.
 * Reasonable defaults: running ≈ 9.8, cycling ≈ 7.5, swimming ≈ 8.0.
 */
export function estimateCalories(
  durationMinutes: number,
  weightKg: number,
  met: number
): number {
  if (!durationMinutes || !weightKg || !met) return 0;
  return Math.round((durationMinutes * met * 3.5 * weightKg) / 200);
}
