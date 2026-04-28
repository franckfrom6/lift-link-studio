import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

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

// ---- Strava sport_type → DB activity_type ----
const RUN = new Set(["Run", "TrailRun", "VirtualRun"]);
const RIDE = new Set([
  "Ride",
  "VirtualRide",
  "MountainBikeRide",
  "EBikeRide",
  "Handcycle",
  "Velomobile",
  "GravelRide",
]);
const HIIT = new Set(["Workout", "HighIntensityIntervalTraining"]);

function mapActivityType(sportType?: string, type?: string): string {
  const t = sportType || type || "";
  if (RUN.has(t)) return "running";
  if (RIDE.has(t)) return "cycling";
  if (HIIT.has(t)) return "hiit";
  if (t === "Pilates") return "pilates";
  if (t === "Boxing") return "boxing";
  return "other";
}

interface StravaActivity {
  id: number;
  name: string;
  sport_type?: string;
  type?: string;
  start_date: string;
  elapsed_time: number;
  distance?: number;
  total_elevation_gain?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("STRAVA_CLIENT_ID"),
      client_secret: Deno.env.get("STRAVA_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false as const, status: res.status, data };
  }
  return { ok: true as const, data };
}

async function fetchActivitiesPage(
  accessToken: string,
  after: number,
  page: number,
) {
  const url = new URL("https://www.strava.com/api/v3/athlete/activities");
  url.searchParams.set("per_page", "50");
  url.searchParams.set("page", String(page));
  url.searchParams.set("after", String(after));
  return fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
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
    const userId = claimsData.claims.sub;

    // Service role client (bypass RLS for tokens + bulk insert)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Load Strava connection
    const { data: conn, error: connErr } = await admin
      .from("strava_connections")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (connErr) {
      console.error("conn load error:", connErr);
      return json({ error: "DB error" }, 500);
    }
    if (!conn) {
      return json({ error: "Strava non connecté" }, 404);
    }

    // 2. Refresh token if needed
    // TODO: add applicative lock if we ever run multiple syncs in parallel
    // (currently UI disables button during sync, so race is unlikely).
    let accessToken: string = conn.access_token;
    const expiresAt = new Date(conn.token_expires_at).getTime();
    const fiveMinFromNow = Date.now() + 5 * 60 * 1000;
    if (expiresAt < fiveMinFromNow) {
      const refreshed = await refreshAccessToken(conn.refresh_token);
      if (!refreshed.ok) {
        if (refreshed.status === 400 || refreshed.status === 401) {
          return json({ error: "Reconnexion Strava nécessaire" }, 401);
        }
        console.error("refresh failed:", refreshed.status, refreshed.data);
        return json({ error: "Strava token refresh failed" }, 502);
      }
      accessToken = refreshed.data.access_token;
      const { error: updErr } = await admin
        .from("strava_connections")
        .update({
          access_token: refreshed.data.access_token,
          refresh_token: refreshed.data.refresh_token ?? conn.refresh_token,
          token_expires_at: new Date(refreshed.data.expires_at * 1000)
            .toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (updErr) console.error("token persist error:", updErr);
    }

    // 3. Sync window
    const NINETY_DAYS = 90 * 24 * 60 * 60;
    const nowSec = Math.floor(Date.now() / 1000);
    const cap = nowSec - NINETY_DAYS;
    let after: number;
    if (!conn.last_sync_at) {
      after = cap;
    } else {
      const lastSec = Math.floor(
        new Date(conn.last_sync_at).getTime() / 1000,
      ) - 3600;
      after = Math.max(lastSec, cap);
    }

    // 4. Paginated fetch
    const activities: StravaActivity[] = [];
    for (let page = 1; page <= 10; page++) {
      const res = await fetchActivitiesPage(accessToken, after, page);
      if (!res.ok) {
        if (res.status === 401) {
          return json({ error: "Reconnexion Strava nécessaire" }, 401);
        }
        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          return json(
            { error: "Strava rate limited", retry_after: retryAfter },
            503,
          );
        }
        if (res.status >= 500) {
          return json({ error: "Strava unavailable" }, 502);
        }
        const body = await res.text();
        console.error("strava activities error:", res.status, body);
        return json({ error: "Strava API error" }, 500);
      }
      const batch: StravaActivity[] = await res.json();
      activities.push(...batch);
      if (batch.length < 50) break;
    }

    // 5. Map + upsert one-by-one to allow per-row failure isolation
    let new_count = 0;
    let updated_count = 0;
    for (const a of activities) {
      const startDate = a.start_date;
      const datePart = startDate.split("T")[0];
      const timePart = startDate.split("T")[1]?.slice(0, 8) ?? null;
      const row = {
        student_id: userId,
        strava_activity_id: a.id,
        provider: "strava",
        date: datePart,
        time_start: timePart,
        activity_label: a.name,
        activity_type: mapActivityType(a.sport_type, a.type),
        duration_minutes: Math.round((a.elapsed_time ?? 0) / 60),
        distance_meters: a.distance != null ? Math.round(a.distance) : null,
        elevation_gain_m: a.total_elevation_gain != null
          ? Math.round(a.total_elevation_gain)
          : null,
        avg_heart_rate: a.average_heartrate != null
          ? Math.round(a.average_heartrate)
          : null,
        max_heart_rate: a.max_heartrate != null
          ? Math.round(a.max_heartrate)
          : null,
        calories: a.calories != null ? Math.round(a.calories) : null,
        strava_raw: a,
      };

      // Detect insert vs update by checking existence first
      const { data: existing } = await admin
        .from("external_sessions")
        .select("id")
        .eq("strava_activity_id", a.id)
        .maybeSingle();

      const { error: upErr } = await admin
        .from("external_sessions")
        .upsert(row, { onConflict: "strava_activity_id" });

      if (upErr) {
        console.error("upsert failed for activity", a.id, upErr);
        continue;
      }
      if (existing) updated_count++;
      else new_count++;
    }

    // 6. Update last_sync_at
    const nowIso = new Date().toISOString();
    await admin
      .from("strava_connections")
      .update({ last_sync_at: nowIso, updated_at: nowIso })
      .eq("user_id", userId);

    return json({
      success: true,
      synced_count: new_count + updated_count,
      new_count,
      updated_count,
      last_sync_at: nowIso,
    });
  } catch (e) {
    console.error("strava-sync-activities fatal:", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});
