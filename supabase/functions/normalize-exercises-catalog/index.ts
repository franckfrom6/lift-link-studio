import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Mapping = { from: string; to: string; flag?: string };

const MUSCLE_GROUP_MAP: Mapping[] = [
  { from: "glutes", to: "Fessiers" },
  { from: "legs", to: "Jambes" },
  { from: "abs", to: "Abdominaux" },
  { from: "chest", to: "Pectoraux" },
  { from: "shoulders", to: "Épaules" },
  { from: "arms", to: "Bras" },
  { from: "back", to: "Dos" },
];

const MUSCLE_GROUP_KNOWN = new Set<string>([
  ...MUSCLE_GROUP_MAP.map((m) => m.from),
  "Jambes", "Abdominaux", "Dos", "Cardio", "Fessiers", "Épaules",
  "Full Body", "Pectoraux", "Triceps", "Biceps", "Mollets", "Trapèzes", "Bras",
]);

const EQUIPMENT_MAP: Mapping[] = [
  { from: "bodyweight", to: "Poids de corps" },
  { from: "Aucun", to: "Poids de corps", flag: "⚠️ Aucun→Poids de corps (validé)" },
  { from: "dumbbells", to: "Haltères" },
  { from: "barbell", to: "Barre" },
  { from: "cable", to: "Câbles" },
  { from: "machine", to: "Machine" },
  { from: "resistance_band", to: "Élastique" },
  { from: "fitness_ball", to: "Ballon de gym" },
  { from: "Médecine Ball", to: "Médecine ball", flag: "casse seule" },
];

const EQUIPMENT_KNOWN = new Set<string>([
  ...EQUIPMENT_MAP.map((m) => m.from),
  "Barre", "Haltères", "Câbles", "Machine", "Élastique", "Kettlebell",
  "Médecine ball", "Ballon de gym", "Poids de corps",
]);

const PUBLIC_CIBLE_MAP: Mapping[] = [
  { from: "all", to: "mixte" },
  { from: "women_focused", to: "femme" },
];

const PUBLIC_CIBLE_KNOWN = new Set<string>([
  ...PUBLIC_CIBLE_MAP.map((m) => m.from),
  "mixte", "femme",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const dry_run: boolean = body.dry_run !== false; // default true
    const confirm: string | undefined = body.confirm;

    if (!dry_run && confirm !== "APPLIQUER_NORMALISATION") {
      return new Response(
        JSON.stringify({ error: "confirm manquant ou invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const SCOPE = (q: any) => q.eq("is_default", true).is("created_by", null);

    // Count rows per source value
    async function countFor(field: string, mappings: Mapping[]) {
      const results: Array<Mapping & { rows: number }> = [];
      for (const m of mappings) {
        const { count, error } = await SCOPE(
          admin.from("exercises").select("id", { count: "exact", head: true }).eq(field, m.from),
        );
        if (error) throw new Error(`count ${field}=${m.from}: ${error.message}`);
        results.push({ ...m, rows: count ?? 0 });
      }
      return results;
    }

    // Apply UPDATE per source value (idempotent)
    async function applyFor(field: string, mappings: Mapping[]) {
      const results: Array<Mapping & { rows: number }> = [];
      for (const m of mappings) {
        const { data, error } = await SCOPE(
          admin.from("exercises").update({ [field]: m.to }).eq(field, m.from).select("id"),
        );
        if (error) throw new Error(`update ${field}=${m.from}: ${error.message}`);
        results.push({ ...m, rows: data?.length ?? 0 });
      }
      return results;
    }

    // Detect unknown values present in scope
    async function unknownValues(field: string, known: Set<string>) {
      const { data, error } = await SCOPE(
        admin.from("exercises").select(field),
      );
      if (error) throw new Error(`scan ${field}: ${error.message}`);
      const set = new Set<string>();
      for (const row of data ?? []) {
        const v = (row as any)[field];
        if (v != null && !known.has(v)) set.add(v);
      }
      return [...set];
    }

    const mg = dry_run
      ? await countFor("muscle_group", MUSCLE_GROUP_MAP)
      : await applyFor("muscle_group", MUSCLE_GROUP_MAP);
    const eq = dry_run
      ? await countFor("equipment", EQUIPMENT_MAP)
      : await applyFor("equipment", EQUIPMENT_MAP);
    const pc = dry_run
      ? await countFor("public_cible", PUBLIC_CIBLE_MAP)
      : await applyFor("public_cible", PUBLIC_CIBLE_MAP);

    const unknown = {
      muscle_group: await unknownValues("muscle_group", MUSCLE_GROUP_KNOWN),
      equipment: await unknownValues("equipment", EQUIPMENT_KNOWN),
      public_cible: await unknownValues("public_cible", PUBLIC_CIBLE_KNOWN),
    };

    const total = [...mg, ...eq, ...pc].reduce((s, r) => s + r.rows, 0);

    const payload: any = {
      mode: dry_run ? "DRY_RUN — aucune écriture" : "APPLIED",
      muscle_group: mg,
      equipment: eq,
      public_cible: pc,
      total_rows_to_update: total,
      valeurs_inconnues: unknown,
    };

    if (dry_run) {
      payload.next_step =
        "Relancer avec { dry_run: false, confirm: 'APPLIQUER_NORMALISATION' } pour appliquer.";
    } else {
      payload.applied = true;
      payload.timestamp = new Date().toISOString();

      // Sanity check
      const anomalies: any = {};
      const enValues = MUSCLE_GROUP_MAP.map((m) => m.from);
      const { data: residual, error: rErr } = await SCOPE(
        admin.from("exercises").select("muscle_group").in("muscle_group", enValues),
      );
      if (rErr) throw new Error(`sanity muscle_group: ${rErr.message}`);
      if ((residual?.length ?? 0) > 0) {
        const counts: Record<string, number> = {};
        for (const r of residual!) {
          const v = (r as any).muscle_group;
          counts[v] = (counts[v] ?? 0) + 1;
        }
        anomalies.muscle_group_residual = counts;
      }

      const { data: pcRows, error: pcErr } = await SCOPE(
        admin.from("exercises").select("public_cible"),
      );
      if (pcErr) throw new Error(`sanity public_cible: ${pcErr.message}`);
      const pcCounts: Record<string, number> = {};
      for (const r of pcRows ?? []) {
        const v = (r as any).public_cible ?? "(null)";
        pcCounts[v] = (pcCounts[v] ?? 0) + 1;
      }
      const badPc = Object.keys(pcCounts).filter(
        (k) => !["mixte", "femme", "(null)"].includes(k),
      );
      if (badPc.length > 0) {
        anomalies.public_cible_unexpected = Object.fromEntries(
          badPc.map((k) => [k, pcCounts[k]]),
        );
      }
      payload.public_cible_distribution = pcCounts;
      if (Object.keys(anomalies).length > 0) payload.anomalies = anomalies;
    }

    return new Response(JSON.stringify(payload, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});