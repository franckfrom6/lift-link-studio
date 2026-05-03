import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import FitParser from "npm:fit-file-parser@1.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ----- Activity type mapping -----
function mapActivityType(raw: string | undefined | null): string {
  if (!raw) return "other";
  const t = String(raw).toLowerCase();
  if (t.includes("run") || t.includes("trail")) return "running";
  if (t.includes("ride") || t.includes("cycl") || t.includes("bike")) return "cycling";
  if (t.includes("swim")) return "swimming";
  if (t.includes("walk") || t.includes("hike")) return "walking";
  if (t.includes("yoga")) return "yoga";
  if (t.includes("pilates")) return "pilates";
  if (t.includes("box")) return "boxing";
  if (t.includes("hiit") || t.includes("interval")) return "hiit";
  if (t.includes("strength") || t.includes("weight") || t.includes("functional")) return "musculation";
  return "other";
}

// ----- Normalized session shape -----
interface NormalizedSession {
  source: "fit_import" | "apple_health";
  external_id: string;
  date: string;          // YYYY-MM-DD
  time_start: string | null; // HH:MM:SS
  activity_type: string;
  activity_label: string | null;
  duration_minutes: number | null;
  distance_meters: number | null;
  elevation_gain_m: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  calories: number | null;
  avg_pace_s_per_km: number | null;
  metrics: Record<string, unknown> | null;
}

function buildExternalId(source: string, isoStart: string, type: string): string {
  // Stable id = source + start timestamp (minute precision) + type
  const minute = isoStart.slice(0, 16); // "2025-01-03T08:30"
  return `${source}:${minute}:${type}`;
}

function isoToParts(iso: string): { date: string; time: string | null } {
  if (!iso) return { date: "", time: null };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: null };
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const time = d.toISOString().slice(11, 19);
  return { date: `${yyyy}-${mm}-${dd}`, time };
}

// ----- Parse Health Auto Export JSON -----
function parseHealthAutoExport(payload: any): NormalizedSession[] {
  const out: NormalizedSession[] = [];
  // Common shapes: { data: { workouts: [...] } } or { workouts: [...] }
  const workouts = payload?.data?.workouts ?? payload?.workouts ?? [];
  if (!Array.isArray(workouts)) return out;

  for (const w of workouts) {
    const startIso = w.start ?? w.startDate ?? w.start_date ?? "";
    const endIso = w.end ?? w.endDate ?? w.end_date ?? "";
    if (!startIso) continue;
    const { date, time } = isoToParts(startIso);
    if (!date) continue;

    const type = mapActivityType(w.name ?? w.workoutActivityType ?? w.type);
    const distM = w.distance?.qty ?? w.distance ?? null;
    const distMeters = typeof distM === "number"
      ? (distM < 1000 ? Math.round(distM * 1000) : Math.round(distM)) // km vs m heuristic
      : null;

    let durationMin: number | null = null;
    if (typeof w.duration === "number") durationMin = Math.round(w.duration / 60);
    else if (startIso && endIso) {
      const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
      if (ms > 0) durationMin = Math.round(ms / 60000);
    }

    const cal = w.activeEnergyBurned?.qty ?? w.activeEnergy ?? w.totalEnergyBurned?.qty ?? null;
    const avgHr = w.avgHeartRate?.qty ?? w.heartRateAvg ?? null;
    const maxHr = w.maxHeartRate?.qty ?? w.heartRateMax ?? null;
    const elev = w.elevationAscended?.qty ?? w.elevationGain ?? null;

    const pace = (type === "running" && distMeters && durationMin)
      ? Math.round((durationMin * 60) / (distMeters / 1000))
      : null;

    out.push({
      source: "apple_health",
      external_id: buildExternalId("apple_health", startIso, type),
      date,
      time_start: time,
      activity_type: type,
      activity_label: w.name ?? null,
      duration_minutes: durationMin,
      distance_meters: distMeters,
      elevation_gain_m: elev != null ? Math.round(Number(elev)) : null,
      avg_heart_rate: avgHr != null ? Math.round(Number(avgHr)) : null,
      max_heart_rate: maxHr != null ? Math.round(Number(maxHr)) : null,
      calories: cal != null ? Math.round(Number(cal)) : null,
      avg_pace_s_per_km: pace,
      metrics: { raw_source: "health_auto_export" },
    });
  }
  return out;
}

// ----- Parse .fit binary -----
async function parseFitBuffer(buf: Uint8Array): Promise<NormalizedSession[]> {
  const parser = new (FitParser as any)({
    force: true,
    speedUnit: "km/h",
    lengthUnit: "m",
    temperatureUnit: "celsius",
    elapsedRecordField: true,
    mode: "list",
  });

  const result: any = await new Promise((resolve, reject) => {
    parser.parse(buf, (err: any, data: any) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const sessions = result?.sessions ?? [];
  const out: NormalizedSession[] = [];
  for (const s of sessions) {
    const startIso = s.start_time ? new Date(s.start_time).toISOString() : "";
    if (!startIso) continue;
    const { date, time } = isoToParts(startIso);
    const type = mapActivityType(s.sport ?? s.sub_sport);
    const distMeters = s.total_distance != null ? Math.round(s.total_distance) : null;
    const durationMin = s.total_timer_time != null
      ? Math.round(s.total_timer_time / 60)
      : null;
    const pace = (type === "running" && distMeters && durationMin)
      ? Math.round((durationMin * 60) / (distMeters / 1000))
      : null;

    out.push({
      source: "fit_import",
      external_id: buildExternalId("fit_import", startIso, type),
      date,
      time_start: time,
      activity_type: type,
      activity_label: s.sport ?? null,
      duration_minutes: durationMin,
      distance_meters: distMeters,
      elevation_gain_m: s.total_ascent != null ? Math.round(s.total_ascent) : null,
      avg_heart_rate: s.avg_heart_rate != null ? Math.round(s.avg_heart_rate) : null,
      max_heart_rate: s.max_heart_rate != null ? Math.round(s.max_heart_rate) : null,
      calories: s.total_calories != null ? Math.round(s.total_calories) : null,
      avg_pace_s_per_km: pace,
      metrics: { raw_source: "fit" },
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth
      .getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return json({ error: "Aucun fichier fourni" }, 400);
    if (file.size > 20 * 1024 * 1024) {
      return json({ error: "Fichier trop volumineux (max 20 Mo)" }, 400);
    }

    const name = file.name.toLowerCase();
    let sessions: NormalizedSession[] = [];

    if (name.endsWith(".json")) {
      const text = await file.text();
      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch {
        return json({ error: "JSON invalide" }, 400);
      }
      sessions = parseHealthAutoExport(payload);
    } else if (name.endsWith(".fit")) {
      const buf = new Uint8Array(await file.arrayBuffer());
      try {
        sessions = await parseFitBuffer(buf);
      } catch (e) {
        console.error("fit parse error:", e);
        return json({ error: "Fichier .fit illisible" }, 400);
      }
    } else {
      return json({ error: "Format non supporté (.fit ou .json attendu)" }, 400);
    }

    if (sessions.length === 0) {
      return json({ success: true, imported: 0, skipped: 0, total: 0 });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let imported = 0;
    let skipped = 0;
    for (const s of sessions) {
      // Check for existing (preserve user-edited notes/RPE on re-import)
      const { data: existing } = await admin
        .from("external_sessions")
        .select("id")
        .eq("source", s.source)
        .eq("external_id", s.external_id)
        .eq("student_id", userId)
        .maybeSingle();

      const row = { ...s, student_id: userId, provider: s.source };

      if (existing) {
        // Update only objective metrics — never touch notes / intensity_perceived
        const { error: upErr } = await admin
          .from("external_sessions")
          .update({
            duration_minutes: row.duration_minutes,
            distance_meters: row.distance_meters,
            elevation_gain_m: row.elevation_gain_m,
            avg_heart_rate: row.avg_heart_rate,
            max_heart_rate: row.max_heart_rate,
            calories: row.calories,
            avg_pace_s_per_km: row.avg_pace_s_per_km,
            metrics: row.metrics,
          })
          .eq("id", existing.id);
        if (upErr) {
          console.error("update failed:", upErr);
          continue;
        }
        skipped++;
      } else {
        const { error: insErr } = await admin
          .from("external_sessions")
          .insert(row);
        if (insErr) {
          console.error("insert failed:", insErr);
          continue;
        }
        imported++;
      }
    }

    return json({
      success: true,
      imported,
      skipped,
      total: sessions.length,
    });
  } catch (e) {
    console.error("import-fit-file fatal:", e);
    return json(
      { error: e instanceof Error ? e.message : "Erreur inconnue" },
      500,
    );
  }
});