import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "https://lift-link-studio.lovable.app",
  "https://id-preview--0363201d-a29c-474b-ab98-106ca7fb6ee7.lovable.app",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const EXERCISES = {
  foam_rolling: "e0000001-0000-0000-0000-000000000001",
  hip_switch: "e0000001-0000-0000-0000-000000000002",
  glute_bridge: "e0000001-0000-0000-0000-000000000003",
  clamshell: "e0000001-0000-0000-0000-000000000004",
  hip_thrust: "a6596777-7300-4c7d-b569-00832dd29f43",
  rdl: "e0000001-0000-0000-0000-000000000005",
  bulgarian: "e0000001-0000-0000-0000-000000000006",
  stepup: "e0000001-0000-0000-0000-000000000007",
  pull_through: "e0000001-0000-0000-0000-000000000008",
  kickback: "e0000001-0000-0000-0000-000000000009",
  abduction: "e0000001-0000-0000-0000-000000000010",
  etirement_piri: "e0000001-0000-0000-0000-000000000011",
  etirement_ischio: "e0000001-0000-0000-0000-000000000012",
  etirement_flech: "e0000001-0000-0000-0000-000000000013",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const userId = user.id;

    // Check if user already has a program
    const { data: existing } = await supabase
      .from("programs")
      .select("id")
      .eq("student_id", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Program already exists", programId: existing[0].id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create program (coach = student for demo)
    const { data: program, error: pErr } = await supabase
      .from("programs")
      .insert({ name: "LOWER BODY — Glutes & Hamstrings Focus", coach_id: userId, student_id: userId, status: "active" })
      .select().single();
    if (pErr) throw pErr;

    // Create week
    const { data: week, error: wErr } = await supabase
      .from("program_weeks")
      .insert({ program_id: program.id, week_number: 1 })
      .select().single();
    if (wErr) throw wErr;

    // Create session (Wednesday = day 3)
    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .insert({ week_id: week.id, day_of_week: 3, name: "Lower Body — Glutes", notes: "Hypertrophie fessiers & ischios" })
      .select().single();
    if (sErr) throw sErr;

    // Create sections
    const sectionsData = [
      { name: "WARM-UP", icon: "🔥", sort_order: 0, duration_estimate: "10 min", notes: "Activation glutes + mobilité hanches." },
      { name: "BLOC A — Compounds lourds", icon: "🏋️", sort_order: 1, duration_estimate: "25 min", notes: "Mouvements principaux. Charges lourdes, hip-dominant." },
      { name: "BLOC B — Unilatéral & Hypertrophie", icon: "🦵", sort_order: 2, duration_estimate: "20 min", notes: "Travail unilatéral pour corriger les asymétries." },
      { name: "BLOC C — Isolation Glutes & Finisher", icon: "🎯", sort_order: 3, duration_estimate: "15 min", notes: "Isolation pure fessiers. Pump et volume métabolique." },
      { name: "COOL-DOWN", icon: "🧘", sort_order: 4, duration_estimate: "5 min", notes: "Étirements statiques ciblés." },
    ];

    const { data: sections, error: secErr } = await supabase
      .from("session_sections")
      .insert(sectionsData.map(s => ({ ...s, session_id: session.id })))
      .select()
      .order("sort_order");
    if (secErr) throw secErr;

    // Map exercises to sections
    const exercisesMap: Record<number, Array<{
      exercise_id: string; sort_order: number; sets: number; reps_min: number; reps_max: number;
      rest_seconds: number; tempo?: string; rpe_target?: string; coach_notes?: string;
      video_url?: string; suggested_weight?: number;
    }>> = {
      0: [ // WARM-UP
        { exercise_id: EXERCISES.foam_rolling, sort_order: 0, sets: 1, reps_min: 1, reps_max: 1, rest_seconds: 0, coach_notes: "2 min. Insister sur les points de tension", video_url: "https://www.youtube.com/watch?v=SrUvx4YJmbo" },
        { exercise_id: EXERCISES.hip_switch, sort_order: 1, sets: 2, reps_min: 8, reps_max: 8, rest_seconds: 0, tempo: "Contrôlé", coach_notes: "8/côté. Mobilité rotation hanche", video_url: "https://www.youtube.com/watch?v=dEPaAX_nvbw" },
        { exercise_id: EXERCISES.glute_bridge, sort_order: 2, sets: 2, reps_min: 15, reps_max: 15, rest_seconds: 0, tempo: "2-0-2-1", coach_notes: "PDC + élastique genoux. Squeeze 2s en haut", video_url: "https://www.youtube.com/watch?v=OUgsJ8-Vi0E" },
        { exercise_id: EXERCISES.clamshell, sort_order: 3, sets: 2, reps_min: 12, reps_max: 12, rest_seconds: 0, tempo: "2-0-1-1", coach_notes: "12/côté. Élastique moyen", video_url: "https://www.youtube.com/watch?v=cEhHoOBbFOQ" },
      ],
      1: [ // BLOC A
        { exercise_id: EXERCISES.hip_thrust, sort_order: 0, sets: 4, reps_min: 8, reps_max: 10, rest_seconds: 150, tempo: "2-0-1-2", rpe_target: "8-9", coach_notes: "Menton rentré, côtes basses, squeeze maximal. Viser +2.5kg/semaine", video_url: "https://www.youtube.com/watch?v=xDmFkJxPzeM" },
        { exercise_id: EXERCISES.rdl, sort_order: 1, sets: 4, reps_min: 10, reps_max: 12, rest_seconds: 120, tempo: "3-0-1-1", rpe_target: "7-8", coach_notes: "Étirement max ischios. Barre proche du corps, hinge aux hanches", video_url: "https://www.youtube.com/watch?v=7j-2w4-P14I" },
      ],
      2: [ // BLOC B
        { exercise_id: EXERCISES.bulgarian, sort_order: 0, sets: 3, reps_min: 10, reps_max: 12, rest_seconds: 90, tempo: "2-1-1-0", rpe_target: "8", coach_notes: "10-12/côté. Buste penché pour recruter les glutes", video_url: "https://www.youtube.com/watch?v=2C-uNgKwPLE" },
        { exercise_id: EXERCISES.stepup, sort_order: 1, sets: 3, reps_min: 10, reps_max: 10, rest_seconds: 90, tempo: "2-0-1-1", rpe_target: "7-8", coach_notes: "10/côté. Box hauteur genou. Pousser à travers le talon", video_url: "https://www.youtube.com/watch?v=dQqApCGd5Ss" },
      ],
      3: [ // BLOC C
        { exercise_id: EXERCISES.pull_through, sort_order: 0, sets: 3, reps_min: 15, reps_max: 15, rest_seconds: 75, tempo: "2-0-1-2", rpe_target: "7-8", coach_notes: "Squeeze glutes en fin de mouvement", video_url: "https://www.youtube.com/watch?v=ArPaAX_nvbw" },
        { exercise_id: EXERCISES.kickback, sort_order: 1, sets: 3, reps_min: 12, reps_max: 15, rest_seconds: 60, tempo: "2-0-1-1", rpe_target: "8", coach_notes: "12-15/côté. Contrôle total, pas de momentum", video_url: "https://www.youtube.com/watch?v=dFp37Ias7oo" },
        { exercise_id: EXERCISES.abduction, sort_order: 2, sets: 3, reps_min: 15, reps_max: 20, rest_seconds: 60, tempo: "1-0-1-1", rpe_target: "9", coach_notes: "Buste penché en avant. Dernier set : drop set 🔥", video_url: "https://www.youtube.com/watch?v=wz-vA3AvMLY" },
      ],
      4: [ // COOL-DOWN
        { exercise_id: EXERCISES.etirement_piri, sort_order: 0, sets: 1, reps_min: 1, reps_max: 1, rest_seconds: 0, coach_notes: "45s/côté. Figure 4 stretch", video_url: "https://www.youtube.com/watch?v=jRBLMxePwRs" },
        { exercise_id: EXERCISES.etirement_ischio, sort_order: 1, sets: 1, reps_min: 1, reps_max: 1, rest_seconds: 0, coach_notes: "45s/côté. Hinge en avant, dos droit", video_url: "https://www.youtube.com/watch?v=3MxHX9j15MU" },
        { exercise_id: EXERCISES.etirement_flech, sort_order: 2, sets: 1, reps_min: 1, reps_max: 1, rest_seconds: 0, coach_notes: "45s/côté. Squeeze fessier côté étiré", video_url: "https://www.youtube.com/watch?v=ePOUGBMTcHo" },
      ],
    };

    // Insert all exercises
    const allExercises: any[] = [];
    for (let i = 0; i < sections.length; i++) {
      const sectionExercises = exercisesMap[i] || [];
      for (const ex of sectionExercises) {
        allExercises.push({
          ...ex,
          session_id: session.id,
          section_id: sections[i].id,
        });
      }
    }

    const { error: exErr } = await supabase.from("session_exercises").insert(allExercises);
    if (exErr) throw exErr;

    // Create progression phases
    const progressionData = [
      { program_id: program.id, week_label: "Semaines 1-2", description: "Apprentissage des tempos, trouver les charges de travail (RPE 7-8)", week_start: 1, week_end: 2, is_deload: false, sort_order: 0 },
      { program_id: program.id, week_label: "Semaines 3-4", description: "Augmenter charges de 2.5-5kg sur Hip Thrust et RDL", week_start: 3, week_end: 4, is_deload: false, sort_order: 1 },
      { program_id: program.id, week_label: "Semaines 5-6", description: "Augmenter les reps puis re-augmenter les charges", week_start: 5, week_end: 6, is_deload: false, sort_order: 2 },
      { program_id: program.id, week_label: "Semaine 7", description: "DELOAD — 60% des charges, focus technique et récupération", week_start: 7, week_end: 7, is_deload: true, sort_order: 3 },
      { program_id: program.id, week_label: "Semaine 8", description: "Nouveau cycle avec variations", week_start: 8, week_end: 8, is_deload: false, sort_order: 4 },
    ];

    await supabase.from("program_progression").insert(progressionData);

    return new Response(JSON.stringify({ 
      message: "Demo program created",
      programId: program.id,
      sessionId: session.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
