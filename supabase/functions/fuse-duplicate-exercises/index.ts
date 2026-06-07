import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------- Catalogue Groupe A (ids connus) ----------
const FUSIONS_CONNUES = [
  {
    cluster: "bulgarian_split_squat",
    survivant_id: "e0000001-0000-0000-0000-000000000006",
    perdants_ids: [
      "90b8f3ec-b05d-44ff-bc95-6eaba4f758c4",
      "2ba7e5ed-7e32-4a11-baa1-f6a0a5d9f91d",
    ],
    type_final: "compound" as const,
    muscle_group_final: null as string | null,
  },
  {
    cluster: "crunch",
    survivant_id: "8f9e82d8-157e-4ef5-9d31-df229b99bce1",
    perdants_ids: ["b245dd62-816e-43b9-8b5a-ee5f2a8beeae"],
    type_final: "isolation" as const,
    muscle_group_final: null,
  },
  {
    cluster: "glute_bridge",
    survivant_id: "e0000001-0000-0000-0000-000000000003",
    perdants_ids: ["ed1ace1e-3495-4409-98c3-4a5ea1c4e934"],
    type_final: "isolation" as const,
    muscle_group_final: null,
  },
  {
    cluster: "hamstring_stretch",
    survivant_id: "e0000001-0000-0000-0000-000000000012",
    perdants_ids: ["e41477a9-efe8-4b16-b553-860d85b5ff34"],
    type_final: "stretching" as const,
    muscle_group_final: null,
  },
  {
    cluster: "leg_press",
    survivant_id: "7247da35-f864-4538-9ed4-56a43f8d2ad5",
    perdants_ids: ["3881a508-b70d-4029-adc8-6c19787c320b"],
    type_final: "compound" as const,
    muscle_group_final: null,
  },
  {
    cluster: "push_ups",
    survivant_id: "a3b01f18-88e9-488c-a9f4-1d0cc24ada2b",
    perdants_ids: ["5cb853d0-b567-47a3-98eb-711c15c9211b"],
    type_final: "compound" as const,
    muscle_group_final: null,
  },
];

// ---------- Catalogue Groupe B (résolution par nom) ----------
type FusionVis = {
  cluster: string;
  survivant_name_fr: string | null;
  survivant_name_en: string;
  perdants: string[];
  muscle_group_final: string;
  type_final: string;
  equipment_final?: string;
  rename_survivant_to?: string;
  dynamic_survivant?: boolean;
  flag?: string;
};

const FUSIONS_VISUELLES: FusionVis[] = [
  { cluster: "hip_thrust_barre", survivant_name_fr: "Hip thrust", survivant_name_en: "Hip Thrust", perdants: ["Hip Thrust barre", "Barbell Hip Thrust"], muscle_group_final: "Fessiers", type_final: "compound", equipment_final: "Barre" },
  { cluster: "plank", survivant_name_fr: "Planche", survivant_name_en: "Plank", perdants: ["Planche frontale", "Front Plank"], muscle_group_final: "Abdominaux", type_final: "isolation" },
  { cluster: "skull_crusher", survivant_name_fr: "Skull Crusher", survivant_name_en: "Skull Crusher", perdants: ["Skull crushers"], muscle_group_final: "Triceps", type_final: "isolation" },
  { cluster: "childs_pose", survivant_name_fr: "Posture de l'enfant", survivant_name_en: "Child's Pose", perdants: ["Child's Pose"], muscle_group_final: "Dos", type_final: "stretching" },
  { cluster: "pull_up", survivant_name_fr: "Tractions", survivant_name_en: "Pull-Up", perdants: ["Tractions pronation", "Pull-ups"], muscle_group_final: "Dos", type_final: "compound" },
  { cluster: "deadlift", survivant_name_fr: "Soulevé de terre", survivant_name_en: "Deadlift", perdants: ["Deadlift conventionnel", "Conventional Deadlift"], muscle_group_final: "Dos", type_final: "compound" },
  { cluster: "lateral_lunge", survivant_name_fr: "Fente latérale", survivant_name_en: "Lateral Lunge", perdants: ["Fentes latérales", "Lateral Lunges"], muscle_group_final: "Jambes", type_final: "compound" },
  { cluster: "rdl_barre", survivant_name_fr: "RDL Barre", survivant_name_en: "Romanian Deadlift", perdants: ["Soulevé de terre roumain barre"], muscle_group_final: "Jambes", type_final: "compound" },
  { cluster: "rdl_halteres", survivant_name_fr: "RDL Haltères", survivant_name_en: "Romanian Deadlift (Dumbbell)", perdants: ["Soulevé de terre roumain haltères"], muscle_group_final: "Jambes", type_final: "compound" },
  { cluster: "goblet_squat", survivant_name_fr: "Goblet Squat", survivant_name_en: "Goblet Squat", perdants: ["Kettlebell goblet squat"], muscle_group_final: "Jambes", type_final: "compound" },
  { cluster: "step_up", survivant_name_fr: "Step-Up", survivant_name_en: "Step-Up", perdants: ["Step-up haltères", "Dumbbell Step-ups"], muscle_group_final: "Jambes", type_final: "compound" },
  { cluster: "squat_triplon", survivant_name_fr: "Squat", survivant_name_en: "Squat", perdants: ["Back Squat", "Squat Barre", "Barbell Back Squat"], muscle_group_final: "Jambes", type_final: "compound", flag: "ARBITRAGE_4_A_VALIDER" },
  { cluster: "lunges", survivant_name_fr: "Fentes", survivant_name_en: "Lunges", perdants: ["Fentes avant haltères", "Dumbbell Forward Lunges"], muscle_group_final: "Jambes", type_final: "compound", flag: "ARBITRAGE_5_A_VALIDER" },
  { cluster: "leg_curl_generique", survivant_name_fr: "Leg curl", survivant_name_en: "Leg Curl", perdants: ["Leg curl allongé"], muscle_group_final: "Jambes", type_final: "isolation", rename_survivant_to: "Leg curl allongé", flag: "ARBITRAGE_3_A_VALIDER" },
  { cluster: "chest_stretch", survivant_name_fr: "Étirement pectoraux", survivant_name_en: "Chest Stretch", perdants: ["Étirement pectoraux mur", "Wall Chest Stretch"], muscle_group_final: "Pectoraux", type_final: "stretching", flag: "ARBITRAGE_6_A_VALIDER" },
  { cluster: "incline_bench_halteres", survivant_name_fr: "Développé incliné haltères", survivant_name_en: "Incline Dumbbell Press", perdants: ["Développé incliné", "Incline Bench Press"], muscle_group_final: "Pectoraux", type_final: "compound" },
  { cluster: "chest_fly", survivant_name_fr: "Écarté couché", survivant_name_en: "Dumbbell Fly", perdants: ["Écarté couché haltères", "Dumbbell Flyes"], muscle_group_final: "Pectoraux", type_final: "isolation" },
  { cluster: "overhead_press_barre", survivant_name_fr: "Développé militaire", survivant_name_en: "Overhead Press", perdants: ["Développé militaire barre", "Barbell Overhead Press"], muscle_group_final: "Épaules", type_final: "compound" },
  { cluster: "face_pull", survivant_name_fr: "Face Pull", survivant_name_en: "Face Pull", perdants: ["Face pull câble", "Cable Face Pull"], muscle_group_final: "Épaules", type_final: "isolation" },
  { cluster: "reverse_fly", survivant_name_fr: "Oiseau", survivant_name_en: "Reverse Fly", perdants: ["Oiseau haltères", "Dumbbell Reverse Flyes"], muscle_group_final: "Épaules", type_final: "isolation" },
  { cluster: "banded_pull_apart", survivant_name_fr: "Banded Pull Apart", survivant_name_en: "Band Pull Apart", perdants: ["Band pull-apart", "Band Pull Apart"], muscle_group_final: "Épaules", type_final: "isolation" },
  { cluster: "calf_raise", survivant_name_fr: "Mollets debout machine", survivant_name_en: "Calf Raise (Machine)", perdants: ["Mollets debout"], muscle_group_final: "Mollets", type_final: "isolation", flag: "ARBITRAGE_7_A_VALIDER" },
  { cluster: "treadmill", survivant_name_fr: null, survivant_name_en: "Treadmill Running", perdants: ["Course sur tapis"], muscle_group_final: "Cardio", type_final: "cardio", flag: "ARBITRAGE_8_A_VALIDER", dynamic_survivant: true },
  { cluster: "worlds_greatest_stretch", survivant_name_fr: "World's Greatest Stretch", survivant_name_en: "World's Greatest Stretch", perdants: ["World greatest stretch"], muscle_group_final: "Full Body", type_final: "warmup" },
];

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const dry_run: boolean = body.dry_run !== false;
    const confirm: string | undefined = body.confirm;
    const skip_clusters: string[] = Array.isArray(body.skip_clusters) ? body.skip_clusters : [];

    if (!dry_run && confirm !== "APPLIQUER_FUSIONS") {
      return new Response(JSON.stringify({ error: "confirm manquant ou invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---------- Load all default exercises ----------
    const { data: allEx, error: loadErr } = await admin
      .from("exercises")
      .select("id, name, name_en, type, muscle_group, equipment")
      .eq("is_default", true)
      .is("created_by", null);
    if (loadErr) throw new Error(`load exercises: ${loadErr.message}`);

    // index by lowered names
    const byName = new Map<string, any[]>();
    for (const ex of allEx ?? []) {
      for (const k of [norm(ex.name), norm(ex.name_en)]) {
        if (!k) continue;
        if (!byName.has(k)) byName.set(k, []);
        byName.get(k)!.push(ex);
      }
    }
    const byId = new Map<string, any>((allEx ?? []).map((e: any) => [e.id, e]));

    // ---------- Ref counting helper ----------
    const TABLES = ["session_exercises", "exercise_favorites", "skipped_exercises", "exercise_video_requests"];
    async function countRefs(exId: string): Promise<Record<string, number>> {
      const out: Record<string, number> = {};
      for (const t of TABLES) {
        const { count, error } = await admin
          .from(t)
          .select("*", { count: "exact", head: true })
          .eq("exercise_id", exId);
        if (error) throw new Error(`count ${t}=${exId}: ${error.message}`);
        out[t] = count ?? 0;
      }
      return out;
    }
    function totalRefs(rec: Record<string, number>) {
      return Object.values(rec).reduce((a, b) => a + b, 0);
    }

    // ---------- Resolve all fusions to {survivant_id, perdants_ids[]} ----------
    type ResolvedFusion = {
      cluster: string;
      flag?: string;
      survivant: { id: string; name: string; total_refs: number };
      perdants: Array<{ id: string; name: string; total_refs: number; fk_a_repointer: Record<string, number> }>;
      type_final: string;
      muscle_group_final: string | null;
      equipment_final?: string;
      rename_survivant_to?: string;
      statut: string;
      warnings: string[];
    };

    const resolved: ResolvedFusion[] = [];
    const unresolved: any[] = [];

    // Group A
    for (const f of FUSIONS_CONNUES) {
      if (skip_clusters.includes(f.cluster)) continue;
      const surv = byId.get(f.survivant_id);
      const warnings: string[] = [];
      if (!surv) {
        unresolved.push({ cluster: f.cluster, reason: `survivant_id introuvable: ${f.survivant_id}` });
        continue;
      }
      const survRefs = await countRefs(f.survivant_id);
      const perdants = [];
      for (const pid of f.perdants_ids) {
        const p = byId.get(pid);
        if (!p) { warnings.push(`perdant absent (déjà supprimé?): ${pid}`); continue; }
        const refs = await countRefs(pid);
        perdants.push({ id: pid, name: p.name, total_refs: totalRefs(refs), fk_a_repointer: refs });
      }
      resolved.push({
        cluster: f.cluster,
        survivant: { id: f.survivant_id, name: surv.name, total_refs: totalRefs(survRefs) },
        perdants,
        type_final: f.type_final,
        muscle_group_final: f.muscle_group_final,
        statut: "CONFIRMÉ",
        warnings,
      });
    }

    // Group B
    for (const f of FUSIONS_VISUELLES) {
      if (skip_clusters.includes(f.cluster)) continue;
      const warnings: string[] = [];
      // candidate survivor (by name fr/en)
      const survCandidates = [
        ...(f.survivant_name_fr ? (byName.get(norm(f.survivant_name_fr)) ?? []) : []),
        ...(byName.get(norm(f.survivant_name_en)) ?? []),
      ];
      const dedupCands = Array.from(new Map(survCandidates.map((e) => [e.id, e])).values());
      // perdant candidates
      const perdantsCands: any[] = [];
      for (const pn of f.perdants) {
        const matches = byName.get(norm(pn)) ?? [];
        for (const m of matches) perdantsCands.push(m);
      }
      const dedupPerd = Array.from(new Map(perdantsCands.map((e) => [e.id, e])).values());

      if (dedupCands.length === 0) {
        unresolved.push({ cluster: f.cluster, reason: "aucun survivant trouvé par nom" });
        continue;
      }

      // Pick survivor: dynamic = most refs, else first candidate not in perdants
      let survivantEx: any;
      if (f.dynamic_survivant) {
        const pool = [...dedupCands, ...dedupPerd];
        const dedup = Array.from(new Map(pool.map((e) => [e.id, e])).values());
        let best = dedup[0]; let bestRefs = -1;
        for (const e of dedup) {
          const r = totalRefs(await countRefs(e.id));
          if (r > bestRefs) { bestRefs = r; best = e; }
        }
        survivantEx = best;
      } else {
        // prefer candidate whose name matches survivor exactly AND not in perdants list
        const perdantIds = new Set(dedupPerd.map((p) => p.id));
        survivantEx = dedupCands.find((c) => !perdantIds.has(c.id)) ?? dedupCands[0];
      }

      // Build final perdants = all loser-name matches + any other survivor candidates not chosen
      const survId = survivantEx.id;
      const perdantsFinal = Array.from(
        new Map(
          [...dedupPerd, ...dedupCands.filter((c) => c.id !== survId)]
            .map((e) => [e.id, e]),
        ).values(),
      ).filter((e) => e.id !== survId);

      const survRefs = await countRefs(survId);
      const perdants = [];
      for (const p of perdantsFinal) {
        const refs = await countRefs(p.id);
        perdants.push({ id: p.id, name: p.name, total_refs: totalRefs(refs), fk_a_repointer: refs });
      }

      if (perdants.length === 0) {
        warnings.push("aucun perdant trouvé — déjà fusionné ?");
      }

      resolved.push({
        cluster: f.cluster,
        flag: f.flag,
        survivant: { id: survId, name: survivantEx.name, total_refs: totalRefs(survRefs) },
        perdants,
        type_final: f.type_final,
        muscle_group_final: f.muscle_group_final,
        equipment_final: f.equipment_final,
        rename_survivant_to: f.rename_survivant_to,
        statut: f.flag ? `⚠️ À VALIDER (${f.flag}) — inclus par défaut` : "CONFIRMÉ",
        warnings,
      });
    }

    const totalToDelete = resolved.reduce((s, r) => s + r.perdants.length, 0);
    const totalRefsToMove = resolved.reduce(
      (s, r) => s + r.perdants.reduce((a, p) => a + p.total_refs, 0),
      0,
    );

    // ---------- DRY RUN ----------
    if (dry_run) {
      return new Response(JSON.stringify({
        mode: "DRY_RUN — aucune écriture",
        fk_autres_tables: {
          note: "FK vérifiées en code: session_exercises, exercise_favorites, skipped_exercises, exercise_video_requests. Pour confirmer qu'aucune autre table ne référence exercises.id, exécuter manuellement la requête information_schema fournie dans la doc.",
          tables_repointees: TABLES,
        },
        fusions: resolved,
        unresolved,
        total_exercices_a_supprimer: totalToDelete,
        total_refs_a_repointer: totalRefsToMove,
        next_step: "Relancer avec { dry_run: false, confirm: 'APPLIQUER_FUSIONS' } pour appliquer.",
      }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---------- APPLY ----------
    const applyLog: any[] = [];

    async function repointSimple(table: string, loserId: string, survivorId: string) {
      const { data, error } = await admin
        .from(table)
        .update({ exercise_id: survivorId })
        .eq("exercise_id", loserId)
        .select("id");
      if (error) throw new Error(`repoint ${table} ${loserId}→${survivorId}: ${error.message}`);
      return data?.length ?? 0;
    }

    // For tables with unique (user_id, exercise_id) — handle per-row to avoid conflict
    async function repointUnique(table: string, loserId: string, survivorId: string): Promise<{ moved: number; deletedOrphan: number }> {
      // load all loser rows
      const { data: losers, error: lerr } = await admin
        .from(table).select("id, user_id").eq("exercise_id", loserId);
      if (lerr) throw new Error(`load ${table} ${loserId}: ${lerr.message}`);
      let moved = 0;
      let deletedOrphan = 0;
      if (!losers || losers.length === 0) return { moved, deletedOrphan };
      // load existing survivor user_ids
      const userIds = losers.map((l: any) => l.user_id);
      const { data: existing, error: eerr } = await admin
        .from(table).select("user_id").eq("exercise_id", survivorId).in("user_id", userIds);
      if (eerr) throw new Error(`existing ${table}: ${eerr.message}`);
      const existingUsers = new Set((existing ?? []).map((r: any) => r.user_id));
      for (const l of losers) {
        if (existingUsers.has(l.user_id)) {
          const { error: derr } = await admin.from(table).delete().eq("id", l.id);
          if (derr) throw new Error(`delete orphan ${table} ${l.id}: ${derr.message}`);
          deletedOrphan++;
        } else {
          const { error: uerr } = await admin
            .from(table).update({ exercise_id: survivorId }).eq("id", l.id);
          if (uerr) throw new Error(`update ${table} ${l.id}: ${uerr.message}`);
          moved++;
        }
      }
      // Final purge in case any leftover loser rows remain
      const { error: perr } = await admin.from(table).delete().eq("exercise_id", loserId);
      if (perr) throw new Error(`purge ${table} ${loserId}: ${perr.message}`);
      return { moved, deletedOrphan };
    }

    for (const f of resolved) {
      const log: any = { cluster: f.cluster, survivant_id: f.survivant.id, perdants: [] };

      // Rename survivor first if requested
      if (f.rename_survivant_to) {
        const { error } = await admin
          .from("exercises")
          .update({ name: f.rename_survivant_to })
          .eq("id", f.survivant.id);
        if (error) throw new Error(`rename survivant ${f.survivant.id}: ${error.message}`);
        log.renamed_to = f.rename_survivant_to;
      }

      // Update survivor type / muscle_group / equipment
      const survPatch: any = {};
      if (f.type_final) survPatch.type = f.type_final;
      if (f.muscle_group_final) survPatch.muscle_group = f.muscle_group_final;
      if (f.equipment_final) survPatch.equipment = f.equipment_final;
      if (Object.keys(survPatch).length > 0) {
        const { error } = await admin
          .from("exercises").update(survPatch).eq("id", f.survivant.id);
        if (error) throw new Error(`update survivant ${f.survivant.id}: ${error.message}`);
        log.survivant_patch = survPatch;
      }

      for (const p of f.perdants) {
        // Idempotence: check still exists
        const { data: stillExists } = await admin
          .from("exercises").select("id").eq("id", p.id).maybeSingle();
        if (!stillExists) {
          log.perdants.push({ id: p.id, skipped: "déjà supprimé" });
          continue;
        }

        const se = await repointSimple("session_exercises", p.id, f.survivant.id);
        const fav = await repointUnique("exercise_favorites", p.id, f.survivant.id);
        const sk = await repointUnique("skipped_exercises", p.id, f.survivant.id);
        const evr = await repointSimple("exercise_video_requests", p.id, f.survivant.id);

        const { error: delErr } = await admin.from("exercises").delete().eq("id", p.id);
        if (delErr) throw new Error(`delete ${p.id}: ${delErr.message}`);

        log.perdants.push({
          id: p.id, name: p.name,
          session_exercises_moved: se,
          exercise_favorites: fav,
          skipped_exercises: sk,
          exercise_video_requests_moved: evr,
          deleted: true,
        });
      }
      applyLog.push(log);
    }

    // ---------- Phase 3 — Corrections de type ----------
    const phase3: any = {};
    // Hip thrust machine : isolation → compound
    const { data: htm } = await admin
      .from("exercises").select("id, name, name_en, type")
      .eq("is_default", true).is("created_by", null).eq("type", "isolation");
    const htmIds = (htm ?? []).filter((e: any) => {
      const n = norm(e.name); const ne = norm(e.name_en);
      return (n.includes("hip thrust") && n.includes("machine")) || (ne.includes("hip thrust") && ne.includes("machine"));
    }).map((e: any) => e.id);
    if (htmIds.length > 0) {
      const { error } = await admin.from("exercises").update({ type: "compound" }).in("id", htmIds);
      if (error) throw new Error(`hip thrust machine fix: ${error.message}`);
    }
    phase3.hip_thrust_machine_to_compound = htmIds.length;

    // Face pull élastique/band : compound → isolation
    const { data: fp } = await admin
      .from("exercises").select("id, name, name_en, type")
      .eq("is_default", true).is("created_by", null).eq("type", "compound");
    const fpIds = (fp ?? []).filter((e: any) => {
      const n = norm(e.name); const ne = norm(e.name_en);
      return (n.includes("face pull") && n.includes("élastique")) ||
             (ne.includes("face pull") && (ne.includes("elastic") || ne.includes("band")));
    }).map((e: any) => e.id);
    if (fpIds.length > 0) {
      const { error } = await admin.from("exercises").update({ type: "isolation" }).in("id", fpIds);
      if (error) throw new Error(`face pull elastic fix: ${error.message}`);
    }
    phase3.face_pull_elastique_to_isolation = fpIds.length;

    // ---------- Sanity checks ----------
    const sanity: any = {};

    // 1. Doublons résiduels
    const { data: allDef } = await admin
      .from("exercises").select("id, name, name_en")
      .eq("is_default", true).is("created_by", null);
    const keyMap = new Map<string, number>();
    for (const e of allDef ?? []) {
      const k = norm((e as any).name_en) || norm((e as any).name);
      keyMap.set(k, (keyMap.get(k) ?? 0) + 1);
    }
    sanity.doublons_residuels = [...keyMap.entries()].filter(([, n]) => n > 1).map(([k, n]) => ({ key: k, nb: n }));

    // 2. FK orphelines
    const existingIds = new Set((allEx ?? []).map((e: any) => e.id));
    // Reload because we deleted some
    const { data: liveIds } = await admin.from("exercises").select("id");
    const liveSet = new Set((liveIds ?? []).map((e: any) => e.id));
    sanity.fk_orphelines = {};
    for (const t of TABLES) {
      const { data: rows } = await admin.from(t).select("exercise_id");
      const orphans = (rows ?? []).filter((r: any) => r.exercise_id && !liveSet.has(r.exercise_id)).length;
      sanity.fk_orphelines[t] = orphans;
    }

    // 3. Comptage final
    sanity.total_default_exercises = (allDef ?? []).length;

    // 4. Valeurs EN résiduelles
    const enVals = ["glutes", "legs", "abs", "chest", "shoulders", "arms", "back"];
    const enRes = (allDef ?? []).filter((e: any) => enVals.includes(e.muscle_group ?? ""));
    sanity.muscle_group_en_residuels = enRes.length;

    return new Response(JSON.stringify({
      mode: "APPLIED",
      applied: true,
      timestamp: new Date().toISOString(),
      fusions: applyLog,
      phase3,
      sanity_checks: sanity,
      total_exercices_supprimes: totalToDelete,
    }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});