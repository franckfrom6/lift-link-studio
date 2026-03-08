import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Exercise definitions (name → metadata) ───
const EXERCISE_DEFS: Record<string, { name_en: string; muscle_group: string; equipment: string; type: string; secondary_muscle?: string }> = {
  // Warm-up / Mobility (some already exist from seed-demo-program)
  "Rameur": { name_en: "Rowing Machine", muscle_group: "Cardio", equipment: "Machine", type: "compound" },
  "Banded Pull Apart": { name_en: "Banded Pull Apart", muscle_group: "Épaules", equipment: "Élastique", type: "isolation" },
  "Hip Circle": { name_en: "Hip Circle", muscle_group: "Fessiers", equipment: "Élastique", type: "isolation" },
  "Goblet Squat": { name_en: "Goblet Squat", muscle_group: "Jambes", equipment: "Kettlebell", type: "compound", secondary_muscle: "Fessiers" },
  "Corde à sauter": { name_en: "Jump Rope", muscle_group: "Cardio", equipment: "Poids du corps", type: "compound" },
  "Dead Bug": { name_en: "Dead Bug", muscle_group: "Abdos", equipment: "Poids du corps", type: "isolation" },
  "World's Greatest Stretch": { name_en: "World's Greatest Stretch", muscle_group: "Jambes", equipment: "Poids du corps", type: "compound" },
  "Bird Dog": { name_en: "Bird Dog", muscle_group: "Abdos", equipment: "Poids du corps", type: "isolation" },
  "Band Walks": { name_en: "Band Walks", muscle_group: "Fessiers", equipment: "Élastique", type: "isolation" },
  "Push-ups": { name_en: "Push-ups", muscle_group: "Pectoraux", equipment: "Poids du corps", type: "compound" },
  "Shoulder Dislocate": { name_en: "Shoulder Dislocate", muscle_group: "Épaules", equipment: "Barre", type: "isolation" },
  "Inchworm": { name_en: "Inchworm", muscle_group: "Abdos", equipment: "Poids du corps", type: "compound" },
  "Jumping Jacks": { name_en: "Jumping Jacks", muscle_group: "Cardio", equipment: "Poids du corps", type: "compound" },
  // Compounds
  "Squat Barre": { name_en: "Barbell Back Squat", muscle_group: "Jambes", equipment: "Barre", type: "compound", secondary_muscle: "Fessiers" },
  "Développé épaules haltères": { name_en: "Dumbbell Shoulder Press", muscle_group: "Épaules", equipment: "Haltères", type: "compound" },
  "Développé couché haltères": { name_en: "Dumbbell Bench Press", muscle_group: "Pectoraux", equipment: "Haltères", type: "compound", secondary_muscle: "Épaules" },
  "Soulevé de terre": { name_en: "Barbell Deadlift", muscle_group: "Dos", equipment: "Barre", type: "compound", secondary_muscle: "Jambes" },
  "Tractions": { name_en: "Pull-ups", muscle_group: "Dos", equipment: "Poids du corps", type: "compound", secondary_muscle: "Bras" },
  "Développé incliné haltères": { name_en: "Incline Dumbbell Press", muscle_group: "Pectoraux", equipment: "Haltères", type: "compound", secondary_muscle: "Épaules" },
  "Front Squat": { name_en: "Front Squat", muscle_group: "Jambes", equipment: "Barre", type: "compound", secondary_muscle: "Abdos" },
  "Tractions lestées": { name_en: "Weighted Pull-ups", muscle_group: "Dos", equipment: "Poids du corps", type: "compound", secondary_muscle: "Bras" },
  // Accessories
  "Leg Extension": { name_en: "Leg Extension", muscle_group: "Jambes", equipment: "Machine", type: "isolation" },
  "Face Pull": { name_en: "Face Pull", muscle_group: "Épaules", equipment: "Câble", type: "isolation", secondary_muscle: "Dos" },
  "RDL Haltères": { name_en: "Dumbbell RDL", muscle_group: "Jambes", equipment: "Haltères", type: "compound", secondary_muscle: "Fessiers" },
  "Rowing haltère": { name_en: "Dumbbell Row", muscle_group: "Dos", equipment: "Haltères", type: "compound" },
  "Curl biceps": { name_en: "Bicep Curl", muscle_group: "Bras", equipment: "Haltères", type: "isolation" },
  "Rowing T-Bar": { name_en: "T-Bar Row", muscle_group: "Dos", equipment: "Barre", type: "compound" },
  "Pallof Press": { name_en: "Pallof Press", muscle_group: "Abdos", equipment: "Câble", type: "isolation" },
  "Arnold Press": { name_en: "Arnold Press", muscle_group: "Épaules", equipment: "Haltères", type: "compound" },
  "Écarté poulie": { name_en: "Cable Fly", muscle_group: "Pectoraux", equipment: "Câble", type: "isolation" },
  "Curl barre EZ": { name_en: "EZ Bar Curl", muscle_group: "Bras", equipment: "Barre", type: "isolation" },
  "Skull Crusher": { name_en: "Skull Crusher", muscle_group: "Bras", equipment: "Barre", type: "isolation" },
  "Leg Curl": { name_en: "Leg Curl", muscle_group: "Jambes", equipment: "Machine", type: "isolation" },
  "Mollets debout": { name_en: "Standing Calf Raise", muscle_group: "Jambes", equipment: "Machine", type: "isolation" },
  "Hanging Leg Raise": { name_en: "Hanging Leg Raise", muscle_group: "Abdos", equipment: "Poids du corps", type: "isolation" },
  "Wall Balls": { name_en: "Wall Balls", muscle_group: "Jambes", equipment: "Médecine Ball", type: "compound" },
  "Burpee Broad Jump": { name_en: "Burpee Broad Jump", muscle_group: "Cardio", equipment: "Poids du corps", type: "compound" },
  "Farmers Carry": { name_en: "Farmers Carry", muscle_group: "Dos", equipment: "Kettlebell", type: "compound", secondary_muscle: "Abdos" },
  "Russian Twist": { name_en: "Russian Twist", muscle_group: "Abdos", equipment: "Poids du corps", type: "isolation" },
  // Conditioning
  "Assault Bike": { name_en: "Assault Bike", muscle_group: "Cardio", equipment: "Machine", type: "compound" },
  "Kettlebell Swing": { name_en: "Kettlebell Swing", muscle_group: "Fessiers", equipment: "Kettlebell", type: "compound", secondary_muscle: "Jambes" },
  "Burpees": { name_en: "Burpees", muscle_group: "Cardio", equipment: "Poids du corps", type: "compound" },
  "SkiErg": { name_en: "SkiErg", muscle_group: "Cardio", equipment: "Machine", type: "compound" },
  "Planche": { name_en: "Plank", muscle_group: "Abdos", equipment: "Poids du corps", type: "isolation" },
  "Running Treadmill": { name_en: "Treadmill Running", muscle_group: "Cardio", equipment: "Machine", type: "compound" },
  "Marche": { name_en: "Walking", muscle_group: "Cardio", equipment: "Poids du corps", type: "compound" },
  // Stretches
  "Étirement pectoraux": { name_en: "Chest Stretch", muscle_group: "Pectoraux", equipment: "Poids du corps", type: "isolation" },
  "Étirement quadriceps": { name_en: "Quad Stretch", muscle_group: "Jambes", equipment: "Poids du corps", type: "isolation" },
  "Child's Pose": { name_en: "Child's Pose", muscle_group: "Dos", equipment: "Poids du corps", type: "isolation" },
  "Cat-Cow": { name_en: "Cat-Cow", muscle_group: "Dos", equipment: "Poids du corps", type: "isolation" },
  "Étirement dorsaux": { name_en: "Lat Stretch", muscle_group: "Dos", equipment: "Poids du corps", type: "isolation" },
  "Cross-body shoulder stretch": { name_en: "Cross-body Shoulder Stretch", muscle_group: "Épaules", equipment: "Poids du corps", type: "isolation" },
  "Goblet Squat Hold": { name_en: "Goblet Squat Hold", muscle_group: "Jambes", equipment: "Kettlebell", type: "compound" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // ─── 1. Find coach ───
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const coachAuth = users.find(u => u.email === "franck.berthelot@from6agency.com");
    if (!coachAuth) throw new Error("Coach not found. Create the coach account first.");
    const coachUserId = coachAuth.id;

    console.log("Coach found:", coachUserId);

    // ─── 2. Find the free and essential plan IDs ───
    const { data: plans } = await supabase.from("plans").select("id, name");
    const essentialPlan = plans?.find(p => p.name === "essential");
    if (!essentialPlan) throw new Error("Essential plan not found");

    // ─── 3. Create athlete auth accounts ───
    const athletes = [
      { email: "yana@demo.f6gym.com", password: "demo1234!", name: "Yana", age: 28, height: 165, weight: 55, level: "Avancé", goal: "Hypertrophie fessiers", sex: "female" },
      { email: "maxime@demo.f6gym.com", password: "demo1234!", name: "Maxime", age: 26, height: 182, weight: 75, level: "Intermédiaire", goal: "Prise de masse", sex: "male" },
      { email: "franck.athlete@demo.f6gym.com", password: "demo1234!", name: "Franck", age: 30, height: 170, weight: 75, level: "Avancé", goal: "Recomposition", sex: "male" },
    ];

    const athleteIds: string[] = [];

    for (const a of athletes) {
      // Check if user already exists
      const existing = users.find(u => u.email === a.email);
      if (existing) {
        athleteIds.push(existing.id);
        console.log(`Athlete ${a.name} already exists: ${existing.id}`);
        continue;
      }
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: a.email,
        password: a.password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      athleteIds.push(newUser.user.id);
      console.log(`Created athlete ${a.name}: ${newUser.user.id}`);
    }

    const [yanaId, maximeId, franckAthleteId] = athleteIds;

    // ─── 4. Create/update profiles ───
    for (let i = 0; i < athletes.length; i++) {
      const a = athletes[i];
      const uid = athleteIds[i];
      await supabase.from("profiles").upsert({
        user_id: uid,
        full_name: a.name,
        role: "student",
        age: a.age,
        height: a.height,
        weight: a.weight,
        level: a.level,
        goal: a.goal,
      }, { onConflict: "user_id" });
    }

    // ─── 5. Create coach_students links ───
    for (const uid of athleteIds) {
      await supabase.from("coach_students").upsert({
        coach_id: coachUserId,
        student_id: uid,
        status: "active",
      }, { onConflict: "coach_id,student_id" }).select();
      // If upsert fails on conflict, try insert ignore
    }
    // Fallback: insert ignoring duplicates
    for (const uid of athleteIds) {
      const { data: existing } = await supabase.from("coach_students")
        .select("id").eq("coach_id", coachUserId).eq("student_id", uid).limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from("coach_students").insert({ coach_id: coachUserId, student_id: uid, status: "active" });
      }
    }

    // ─── 6. Create subscriptions ───
    for (const uid of athleteIds) {
      const { data: existingSub } = await supabase.from("user_subscriptions")
        .select("id").eq("user_id", uid).limit(1);
      if (!existingSub || existingSub.length === 0) {
        await supabase.from("user_subscriptions").insert({
          user_id: uid,
          plan_id: essentialPlan.id,
          status: "active",
        });
      }
    }

    // ─── 7. Find/create exercises ───
    const { data: existingExercises } = await supabase.from("exercises").select("id, name");
    const exerciseMap: Record<string, string> = {};
    
    // Map existing exercises
    for (const ex of existingExercises || []) {
      exerciseMap[ex.name] = ex.id;
    }

    // Create missing exercises
    const missingExercises: any[] = [];
    for (const [name, def] of Object.entries(EXERCISE_DEFS)) {
      if (!exerciseMap[name]) {
        missingExercises.push({
          name,
          name_en: def.name_en,
          muscle_group: def.muscle_group,
          equipment: def.equipment,
          type: def.type,
          secondary_muscle: def.secondary_muscle || null,
          is_default: true,
        });
      }
    }

    if (missingExercises.length > 0) {
      const { data: created, error: exErr } = await supabase.from("exercises").insert(missingExercises).select("id, name");
      if (exErr) throw exErr;
      for (const ex of created || []) {
        exerciseMap[ex.name] = ex.id;
      }
      console.log(`Created ${missingExercises.length} new exercises`);
    }

    // Also map known existing exercises by approximate names
    // The seed-demo-program uses French names — let's also check
    const knownMappings: Record<string, string[]> = {
      "Foam rolling — ischios, fessiers, TFL/IT band": ["Foam Rolling"],
      "90/90 Hip Switch": ["90/90 Hip Switch"],
      "Glute Bridge au sol (activation)": ["Glute Bridge", "Glute Bridge au sol (activation)"],
      "Clamshell avec élastique": ["Clamshell", "Clamshell avec élastique"],
      "Hip Thrust Barre": ["Hip Thrust Barre", "Hip Thrust"],
      "Romanian Deadlift (RDL) Barre": ["RDL Barre", "Romanian Deadlift (RDL) Barre"],
      "Bulgarian Split Squat (haltères)": ["Bulgarian Split Squat", "Bulgarian Split Squat (haltères)"],
      "Step-Up sur box haute (haltères)": ["Step-Up sur box", "Step-Up sur box haute (haltères)"],
      "Cable Pull-Through": ["Cable Pull-Through", "Pull-Through"],
      "Cable Kickback (poulie basse)": ["Cable Kickback", "Cable Kickback (poulie basse)"],
      "Seated Abduction Machine": ["Seated Abduction", "Seated Abduction Machine"],
    };
    // Ensure we have IDs for all known names
    for (const ex of existingExercises || []) {
      exerciseMap[ex.name] = ex.id;
    }

    // Helper to find exercise ID by name (tries exact, then partial match)
    const findExercise = (name: string): string => {
      if (exerciseMap[name]) return exerciseMap[name];
      // Try partial match
      const lower = name.toLowerCase();
      for (const [key, id] of Object.entries(exerciseMap)) {
        if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
          return id;
        }
      }
      throw new Error(`Exercise not found: ${name}`);
    };

    // ─── 8. Create Yana's program (if not exists) ───
    const { data: existingYanaProgram } = await supabase.from("programs")
      .select("id").eq("student_id", yanaId).limit(1);

    if (!existingYanaProgram || existingYanaProgram.length === 0) {
      console.log("Creating Yana's program...");
      // Yana's program is the same as in seed-demo-program — create it here
      const { data: yanaProgram } = await supabase.from("programs").insert({
        name: "LOWER BODY — Glutes & Hamstrings Focus",
        coach_id: coachUserId, student_id: yanaId, status: "active"
      }).select().single();

      const { data: yanaWeek } = await supabase.from("program_weeks").insert({
        program_id: yanaProgram!.id, week_number: 1
      }).select().single();

      const { data: yanaSession } = await supabase.from("sessions").insert({
        week_id: yanaWeek!.id, day_of_week: 3, name: "Lower Body — Glutes", notes: "Hypertrophie fessiers & ischios"
      }).select().single();

      // Sections
      const yanaSections = [
        { name: "WARM-UP", icon: "🔥", sort_order: 0, duration_estimate: "10 min", notes: "Activation glutes + mobilité hanches." },
        { name: "BLOC A — Compounds lourds", icon: "🏋️", sort_order: 1, duration_estimate: "25 min", notes: "Mouvements principaux hip-dominant." },
        { name: "BLOC B — Unilatéral & Hypertrophie", icon: "🦵", sort_order: 2, duration_estimate: "20 min", notes: "Travail unilatéral." },
        { name: "BLOC C — Isolation Glutes & Finisher", icon: "🎯", sort_order: 3, duration_estimate: "15 min", notes: "Isolation pure fessiers." },
        { name: "COOL-DOWN", icon: "🧘", sort_order: 4, duration_estimate: "5 min", notes: "Étirements statiques." },
      ];
      const { data: sections } = await supabase.from("session_sections")
        .insert(yanaSections.map(s => ({ ...s, session_id: yanaSession!.id })))
        .select().order("sort_order");

      // Yana exercises per section (using findExercise)
      const yanaExercises = [
        // Warm-up
        [
          { name: "Foam rolling — ischios, fessiers, TFL/IT band", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "2 min. Insister sur les points de tension" },
          { name: "90/90 Hip Switch", sets: 2, reps_min: 8, reps_max: 8, rest: 0, tempo: "Contrôlé", notes: "8/côté" },
          { name: "Glute Bridge au sol (activation)", sets: 2, reps_min: 15, reps_max: 15, rest: 0, tempo: "2-0-2-1", notes: "PDC + élastique genoux" },
          { name: "Clamshell avec élastique", sets: 2, reps_min: 12, reps_max: 12, rest: 0, tempo: "2-0-1-1", notes: "12/côté" },
        ],
        // Bloc A
        [
          { name: "Hip Thrust Barre", sets: 4, reps_min: 8, reps_max: 10, rest: 150, tempo: "2-0-1-2", rpe: "8-9", notes: "Squeeze maximal. +2.5kg/sem" },
          { name: "Romanian Deadlift (RDL) Barre", sets: 4, reps_min: 10, reps_max: 12, rest: 120, tempo: "3-0-1-1", rpe: "7-8", notes: "Étirement max ischios" },
        ],
        // Bloc B
        [
          { name: "Bulgarian Split Squat (haltères)", sets: 3, reps_min: 10, reps_max: 12, rest: 90, tempo: "2-1-1-0", rpe: "8", notes: "10-12/côté. Buste penché" },
          { name: "Step-Up sur box haute (haltères)", sets: 3, reps_min: 10, reps_max: 10, rest: 90, tempo: "2-0-1-1", rpe: "7-8", notes: "10/côté. Pousser talon" },
        ],
        // Bloc C
        [
          { name: "Cable Pull-Through", sets: 3, reps_min: 15, reps_max: 15, rest: 75, tempo: "2-0-1-2", rpe: "7-8", notes: "Squeeze glutes en fin de mouvement" },
          { name: "Cable Kickback (poulie basse)", sets: 3, reps_min: 12, reps_max: 15, rest: 60, tempo: "2-0-1-1", rpe: "8", notes: "12-15/côté" },
          { name: "Seated Abduction Machine", sets: 3, reps_min: 15, reps_max: 20, rest: 60, tempo: "1-0-1-1", rpe: "9", notes: "Dernier set : drop set 🔥" },
        ],
        // Cool-down
        [
          { name: "Étirement piriforme (figure 4 stretch)", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "45s/côté" },
          { name: "Étirement ischios (debout, pied sur banc)", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "45s/côté" },
          { name: "Étirement fléchisseurs de hanche (lunge stretch)", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "45s/côté" },
        ],
      ];

      const allYanaExercises: any[] = [];
      for (let i = 0; i < sections!.length; i++) {
        for (let j = 0; j < yanaExercises[i].length; j++) {
          const ex = yanaExercises[i][j];
          allYanaExercises.push({
            session_id: yanaSession!.id,
            section_id: sections![i].id,
            exercise_id: findExercise(ex.name),
            sort_order: j,
            sets: ex.sets,
            reps_min: ex.reps_min,
            reps_max: ex.reps_max,
            rest_seconds: ex.rest,
            tempo: (ex as any).tempo || null,
            rpe_target: (ex as any).rpe || null,
            coach_notes: ex.notes,
          });
        }
      }
      await supabase.from("session_exercises").insert(allYanaExercises);

      // Yana progression
      await supabase.from("program_progression").insert([
        { program_id: yanaProgram!.id, week_label: "Semaines 1-2", description: "Apprentissage des tempos, trouver les charges (RPE 7-8)", week_start: 1, week_end: 2, is_deload: false, sort_order: 0 },
        { program_id: yanaProgram!.id, week_label: "Semaines 3-4", description: "+2.5-5kg sur Hip Thrust et RDL", week_start: 3, week_end: 4, is_deload: false, sort_order: 1 },
        { program_id: yanaProgram!.id, week_label: "Semaines 5-6", description: "Augmenter les reps puis les charges", week_start: 5, week_end: 6, is_deload: false, sort_order: 2 },
        { program_id: yanaProgram!.id, week_label: "Semaine 7", description: "DELOAD — 60% des charges, focus technique", week_start: 7, week_end: 7, is_deload: true, sort_order: 3 },
        { program_id: yanaProgram!.id, week_label: "Semaine 8", description: "Nouveau cycle avec variations", week_start: 8, week_end: 8, is_deload: false, sort_order: 4 },
      ]);
    }

    // ─── 9. Create Maxime's program ───
    console.log("Creating Maxime's program...");
    const { data: existingMaxProgram } = await supabase.from("programs")
      .select("id").eq("student_id", maximeId).limit(1);

    if (!existingMaxProgram || existingMaxProgram.length === 0) {
      const { data: maxProgram } = await supabase.from("programs").insert({
        name: "FULL BODY STRENGTH + CARDIO — 12 semaines",
        coach_id: coachUserId, student_id: maximeId, status: "active"
      }).select().single();

      const { data: maxWeek } = await supabase.from("program_weeks").insert({
        program_id: maxProgram!.id, week_number: 1
      }).select().single();

      // ── Session A: Full Body Push + Quads (Monday = 1)
      const { data: sessionA } = await supabase.from("sessions").insert({
        week_id: maxWeek!.id, day_of_week: 1, name: "Full Body A — Push + Quads",
        notes: "Accent Push + Quads. Attention épaule gauche sur les press."
      }).select().single();

      const secA = [
        { name: "WARM-UP", icon: "🔥", sort_order: 0, duration_estimate: "8 min", notes: "Cardio léger + activation." },
        { name: "BLOC A — Compounds", icon: "🏋️", sort_order: 1, duration_estimate: "20 min", notes: "Force : Squat + Press." },
        { name: "BLOC B — Accessoires", icon: "💪", sort_order: 2, duration_estimate: "15 min", notes: "Volume accessoire." },
        { name: "BLOC C — Conditioning", icon: "⚡", sort_order: 3, duration_estimate: "7 min", notes: "Finisher cardio." },
        { name: "COOL-DOWN", icon: "🧘", sort_order: 4, duration_estimate: "5 min", notes: "Étirements." },
      ];
      const { data: sectionsA } = await supabase.from("session_sections")
        .insert(secA.map(s => ({ ...s, session_id: sessionA!.id }))).select().order("sort_order");

      const exA = [
        // Warm-up
        [
          { name: "Rameur", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "3 min cardio léger" },
          { name: "Banded Pull Apart", sets: 2, reps_min: 15, reps_max: 15, rest: 0, notes: "Activation épaules" },
          { name: "Hip Circle", sets: 2, reps_min: 10, reps_max: 10, rest: 0, notes: "10/côté" },
          { name: "Goblet Squat Hold", sets: 2, reps_min: 1, reps_max: 1, rest: 0, notes: "Hold 20s" },
        ],
        // Bloc A
        [
          { name: "Squat Barre", sets: 4, reps_min: 6, reps_max: 8, rest: 150, tempo: "2-0-1-0", rpe: "7-8", notes: "Full depth. +2.5kg/sem." },
          { name: "Développé épaules haltères", sets: 4, reps_min: 8, reps_max: 10, rest: 120, tempo: "2-0-1-0", rpe: "7-8", notes: "Prise neutre en bas. Protège l'épaule." },
        ],
        // Bloc B
        [
          { name: "Développé couché haltères", sets: 3, reps_min: 10, reps_max: 12, rest: 90, tempo: "2-1-1-0", rpe: "7", notes: "Haltères pour protéger l'épaule gauche." },
          { name: "Leg Extension", sets: 3, reps_min: 12, reps_max: 15, rest: 60, tempo: "2-0-1-1", rpe: "8", notes: "Contraction maximale en haut." },
          { name: "Face Pull", sets: 3, reps_min: 15, reps_max: 15, rest: 60, tempo: "2-0-1-1", rpe: "7", notes: "Santé des épaules." },
        ],
        // Conditioning
        [
          { name: "Assault Bike", sets: 5, reps_min: 1, reps_max: 1, rest: 40, notes: "5 rounds : 20s sprint / 40s repos" },
        ],
        // Cool-down
        [
          { name: "Étirement pectoraux", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "30s/côté (doorway stretch)" },
          { name: "Étirement quadriceps", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "30s/côté" },
          { name: "Child's Pose", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "45s" },
        ],
      ];

      const allExA: any[] = [];
      for (let i = 0; i < sectionsA!.length; i++) {
        for (let j = 0; j < exA[i].length; j++) {
          const e = exA[i][j];
          allExA.push({
            session_id: sessionA!.id, section_id: sectionsA![i].id,
            exercise_id: findExercise(e.name), sort_order: j,
            sets: e.sets, reps_min: e.reps_min, reps_max: e.reps_max, rest_seconds: e.rest,
            tempo: (e as any).tempo || null, rpe_target: (e as any).rpe || null, coach_notes: e.notes,
          });
        }
      }
      await supabase.from("session_exercises").insert(allExA);

      // ── Session B: Full Body Pull + Ischios (Wednesday = 3)
      const { data: sessionB } = await supabase.from("sessions").insert({
        week_id: maxWeek!.id, day_of_week: 3, name: "Full Body B — Pull + Ischios",
        notes: "Accent Pull + Ischios. Deadlift = roi des exercices."
      }).select().single();

      const secB = [
        { name: "WARM-UP", icon: "🔥", sort_order: 0, duration_estimate: "8 min", notes: "Corde + mobilité." },
        { name: "BLOC A — Compounds", icon: "🏋️", sort_order: 1, duration_estimate: "20 min", notes: "Deadlift + Tractions." },
        { name: "BLOC B — Accessoires", icon: "💪", sort_order: 2, duration_estimate: "15 min", notes: "RDL + Rowing + Curl." },
        { name: "BLOC C — Conditioning", icon: "⚡", sort_order: 3, duration_estimate: "7 min", notes: "KB Swings." },
        { name: "COOL-DOWN", icon: "🧘", sort_order: 4, duration_estimate: "5 min", notes: "Étirements." },
      ];
      const { data: sectionsB } = await supabase.from("session_sections")
        .insert(secB.map(s => ({ ...s, session_id: sessionB!.id }))).select().order("sort_order");

      const exB = [
        [
          { name: "Corde à sauter", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "3 min" },
          { name: "90/90 Hip Switch", sets: 2, reps_min: 8, reps_max: 8, rest: 0, notes: "8/côté" },
          { name: "Dead Bug", sets: 2, reps_min: 8, reps_max: 8, rest: 0, notes: "8/côté" },
          { name: "Glute Bridge au sol (activation)", sets: 2, reps_min: 12, reps_max: 12, rest: 0, notes: "Activation" },
        ],
        [
          { name: "Soulevé de terre", sets: 4, reps_min: 5, reps_max: 6, rest: 180, tempo: "2-0-1-0", rpe: "7-8", notes: "Technique parfaite. +2.5kg/sem." },
          { name: "Tractions", sets: 4, reps_min: 6, reps_max: 10, rest: 120, tempo: "2-0-1-0", rpe: "8", notes: "Assistées si nécessaire." },
        ],
        [
          { name: "RDL Haltères", sets: 3, reps_min: 10, reps_max: 12, rest: 90, tempo: "3-0-1-1", rpe: "7-8", notes: "Excentrique 3s." },
          { name: "Rowing haltère", sets: 3, reps_min: 10, reps_max: 12, rest: 60, rpe: "7", notes: "10-12/côté." },
          { name: "Curl biceps", sets: 3, reps_min: 12, reps_max: 15, rest: 60, rpe: "8", notes: "Contraction maximale." },
        ],
        [
          { name: "Kettlebell Swing", sets: 4, reps_min: 15, reps_max: 15, rest: 45, notes: "Hinge explosif. Squeeze fessiers." },
        ],
        [
          { name: "Étirement quadriceps", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "45s/côté (ischios pied sur banc)" },
          { name: "Étirement dorsaux", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "30s/côté (child's pose latéral)" },
        ],
      ];

      const allExB: any[] = [];
      for (let i = 0; i < sectionsB!.length; i++) {
        for (let j = 0; j < exB[i].length; j++) {
          const e = exB[i][j];
          allExB.push({
            session_id: sessionB!.id, section_id: sectionsB![i].id,
            exercise_id: findExercise(e.name), sort_order: j,
            sets: e.sets, reps_min: e.reps_min, reps_max: e.reps_max, rest_seconds: e.rest,
            tempo: (e as any).tempo || null, rpe_target: (e as any).rpe || null, coach_notes: e.notes,
          });
        }
      }
      await supabase.from("session_exercises").insert(allExB);

      // ── Session C: Full Body Unilatéral + Core (Friday = 5)
      const { data: sessionC } = await supabase.from("sessions").insert({
        week_id: maxWeek!.id, day_of_week: 5, name: "Full Body C — Unilatéral + Core",
        notes: "Accent unilatéral pour corriger les asymétries."
      }).select().single();

      const secC = [
        { name: "WARM-UP", icon: "🔥", sort_order: 0, duration_estimate: "8 min", notes: "Rameur + mobilité." },
        { name: "BLOC A — Compounds", icon: "🏋️", sort_order: 1, duration_estimate: "20 min", notes: "Bulgarian + Incliné." },
        { name: "BLOC B — Accessoires", icon: "💪", sort_order: 2, duration_estimate: "15 min", notes: "Step-Up + Row + Core." },
        { name: "BLOC C — Conditioning", icon: "⚡", sort_order: 3, duration_estimate: "7 min", notes: "Burpees." },
        { name: "COOL-DOWN", icon: "🧘", sort_order: 4, duration_estimate: "5 min", notes: "Étirements." },
      ];
      const { data: sectionsC } = await supabase.from("session_sections")
        .insert(secC.map(s => ({ ...s, session_id: sessionC!.id }))).select().order("sort_order");

      const exC = [
        [
          { name: "Rameur", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "3 min" },
          { name: "World's Greatest Stretch", sets: 1, reps_min: 3, reps_max: 3, rest: 0, notes: "3/côté" },
          { name: "Bird Dog", sets: 2, reps_min: 8, reps_max: 8, rest: 0, notes: "8/côté" },
          { name: "Band Walks", sets: 2, reps_min: 12, reps_max: 12, rest: 0, notes: "12/côté" },
        ],
        [
          { name: "Bulgarian Split Squat (haltères)", sets: 4, reps_min: 8, reps_max: 10, rest: 90, tempo: "2-1-1-0", rpe: "8", notes: "8-10/côté. Buste penché." },
          { name: "Développé incliné haltères", sets: 4, reps_min: 8, reps_max: 10, rest: 120, tempo: "2-0-1-0", rpe: "7-8", notes: "Incliné = moins de stress épaule." },
        ],
        [
          { name: "Step-Up sur box haute (haltères)", sets: 3, reps_min: 10, reps_max: 10, rest: 60, tempo: "2-0-1-1", rpe: "7", notes: "10/côté." },
          { name: "Rowing T-Bar", sets: 3, reps_min: 10, reps_max: 12, rest: 90, tempo: "2-0-1-1", rpe: "7", notes: "Contrôle total." },
          { name: "Pallof Press", sets: 3, reps_min: 12, reps_max: 12, rest: 60, tempo: "2-0-2-0", rpe: "7", notes: "12/côté. Anti-rotation." },
        ],
        [
          { name: "Burpees", sets: 3, reps_min: 10, reps_max: 10, rest: 60, notes: "Rythme soutenu. Technique propre." },
        ],
        [
          { name: "Étirement quadriceps", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "Hip Flexor Lunge Stretch 45s/côté" },
          { name: "Shoulder Dislocate", sets: 1, reps_min: 10, reps_max: 10, rest: 0, notes: "10 reps lents" },
          { name: "Cat-Cow", sets: 1, reps_min: 8, reps_max: 8, rest: 0, notes: "8 reps" },
        ],
      ];

      const allExC: any[] = [];
      for (let i = 0; i < sectionsC!.length; i++) {
        for (let j = 0; j < exC[i].length; j++) {
          const e = exC[i][j];
          allExC.push({
            session_id: sessionC!.id, section_id: sectionsC![i].id,
            exercise_id: findExercise(e.name), sort_order: j,
            sets: e.sets, reps_min: e.reps_min, reps_max: e.reps_max, rest_seconds: e.rest,
            tempo: (e as any).tempo || null, rpe_target: (e as any).rpe || null, coach_notes: e.notes,
          });
        }
      }
      await supabase.from("session_exercises").insert(allExC);

      // Maxime progression
      await supabase.from("program_progression").insert([
        { program_id: maxProgram!.id, week_label: "Semaines 1-4", description: "Apprentissage, trouver les charges de travail", week_start: 1, week_end: 4, is_deload: false, sort_order: 0 },
        { program_id: maxProgram!.id, week_label: "Semaines 5-8", description: "+2.5kg sur Squat, DL, Dev incliné chaque semaine", week_start: 5, week_end: 8, is_deload: false, sort_order: 1 },
        { program_id: maxProgram!.id, week_label: "Semaines 9-10", description: "Augmenter les reps (haut de fourchette)", week_start: 9, week_end: 10, is_deload: false, sort_order: 2 },
        { program_id: maxProgram!.id, week_label: "Semaine 11", description: "DELOAD — réduire charges et volume", week_start: 11, week_end: 11, is_deload: true, sort_order: 3 },
        { program_id: maxProgram!.id, week_label: "Semaine 12", description: "Test de maxes ou transition nouveau cycle", week_start: 12, week_end: 12, is_deload: false, sort_order: 4 },
      ]);

      console.log("Maxime's program created");
    }

    // ─── 10. Create Franck-Athlete's program ───
    console.log("Creating Franck-Athlete's program...");
    const { data: existingFranckProgram } = await supabase.from("programs")
      .select("id").eq("student_id", franckAthleteId).limit(1);

    if (!existingFranckProgram || existingFranckProgram.length === 0) {
      const { data: franckProgram } = await supabase.from("programs").insert({
        name: "LEAN & MEAN — Recomp + Performance (10 semaines)",
        coach_id: coachUserId, student_id: franckAthleteId, status: "active"
      }).select().single();

      const { data: franckWeek } = await supabase.from("program_weeks").insert({
        program_id: franckProgram!.id, week_number: 1
      }).select().single();

      // ── Session A: Upper Body (Monday = 1)
      const { data: fSessionA } = await supabase.from("sessions").insert({
        week_id: franckWeek!.id, day_of_week: 1, name: "Upper Body — Strength + Hypertrophie",
        notes: "Force + volume haut du corps. Charges lourdes sur les compounds."
      }).select().single();

      const fSecA = [
        { name: "WARM-UP", icon: "🔥", sort_order: 0, duration_estimate: "6 min", notes: "Rameur + activation épaules." },
        { name: "BLOC A — Force", icon: "🏋️", sort_order: 1, duration_estimate: "18 min", notes: "Dev couché + Tractions lestées." },
        { name: "BLOC B — Hypertrophie", icon: "💪", sort_order: 2, duration_estimate: "15 min", notes: "Arnold + Row + Écarté." },
        { name: "BLOC C — Arms superset", icon: "🔥", sort_order: 3, duration_estimate: "8 min", notes: "Curl + Skull Crusher." },
        { name: "COOL-DOWN", icon: "🧘", sort_order: 4, duration_estimate: "3 min", notes: "Étirements." },
      ];
      const { data: fSectionsA } = await supabase.from("session_sections")
        .insert(fSecA.map(s => ({ ...s, session_id: fSessionA!.id }))).select().order("sort_order");

      const fExA = [
        [
          { name: "Rameur", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "2 min" },
          { name: "Banded Pull Apart", sets: 2, reps_min: 15, reps_max: 15, rest: 0, notes: "Activation épaules" },
          { name: "Shoulder Dislocate", sets: 1, reps_min: 10, reps_max: 10, rest: 0, notes: "10 reps lents" },
          { name: "Push-ups", sets: 2, reps_min: 10, reps_max: 10, rest: 0, notes: "Activation pecs" },
        ],
        [
          { name: "Développé couché haltères", sets: 4, reps_min: 6, reps_max: 8, rest: 150, tempo: "2-0-1-0", rpe: "8-9", notes: "Charges lourdes, contrôle total." },
          { name: "Tractions lestées", sets: 4, reps_min: 6, reps_max: 8, rest: 150, tempo: "2-0-1-0", rpe: "8-9", notes: "Ceinture lestée ou haltère." },
        ],
        [
          { name: "Arnold Press", sets: 3, reps_min: 10, reps_max: 12, rest: 90, tempo: "2-0-1-0", rpe: "8", notes: "Rotation complète." },
          { name: "Rowing T-Bar", sets: 3, reps_min: 10, reps_max: 12, rest: 90, tempo: "2-0-1-1", rpe: "8", notes: "Squeeze omoplates." },
          { name: "Écarté poulie", sets: 3, reps_min: 12, reps_max: 15, rest: 60, tempo: "2-0-1-1", rpe: "8", notes: "Stretch + squeeze." },
        ],
        [
          { name: "Curl barre EZ", sets: 3, reps_min: 10, reps_max: 12, rest: 60, notes: "Superset avec Skull Crusher." },
          { name: "Skull Crusher", sets: 3, reps_min: 10, reps_max: 12, rest: 60, notes: "Superset. Enchaîner sans repos." },
        ],
        [
          { name: "Étirement pectoraux", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "30s/côté (doorway)" },
          { name: "Cross-body shoulder stretch", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "30s/côté" },
        ],
      ];

      const allFExA: any[] = [];
      for (let i = 0; i < fSectionsA!.length; i++) {
        for (let j = 0; j < fExA[i].length; j++) {
          const e = fExA[i][j];
          allFExA.push({
            session_id: fSessionA!.id, section_id: fSectionsA![i].id,
            exercise_id: findExercise(e.name), sort_order: j,
            sets: e.sets, reps_min: e.reps_min, reps_max: e.reps_max, rest_seconds: e.rest,
            tempo: (e as any).tempo || null, rpe_target: (e as any).rpe || null, coach_notes: e.notes,
          });
        }
      }
      await supabase.from("session_exercises").insert(allFExA);

      // ── Session B: Lower Body (Wednesday = 3)
      const { data: fSessionB } = await supabase.from("sessions").insert({
        week_id: franckWeek!.id, day_of_week: 3, name: "Lower Body — Strength + Volume",
        notes: "Front Squat + RDL. Force + unilatéral."
      }).select().single();

      const fSecB = [
        { name: "WARM-UP", icon: "🔥", sort_order: 0, duration_estimate: "6 min", notes: "Assault Bike + activation." },
        { name: "BLOC A — Force", icon: "🏋️", sort_order: 1, duration_estimate: "18 min", notes: "Front Squat + RDL." },
        { name: "BLOC B — Unilatéral", icon: "🦵", sort_order: 2, duration_estimate: "12 min", notes: "Bulgarian + Leg Curl." },
        { name: "BLOC C — Mollets + Core", icon: "🎯", sort_order: 3, duration_estimate: "8 min", notes: "Mollets + Hanging Leg Raise." },
        { name: "COOL-DOWN", icon: "🧘", sort_order: 4, duration_estimate: "3 min", notes: "Étirements." },
      ];
      const { data: fSectionsB } = await supabase.from("session_sections")
        .insert(fSecB.map(s => ({ ...s, session_id: fSessionB!.id }))).select().order("sort_order");

      const fExB = [
        [
          { name: "Assault Bike", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "2 min" },
          { name: "Hip Circle", sets: 2, reps_min: 10, reps_max: 10, rest: 0, notes: "10/côté" },
          { name: "Goblet Squat", sets: 2, reps_min: 8, reps_max: 8, rest: 0, notes: "Activation" },
          { name: "Glute Bridge au sol (activation)", sets: 2, reps_min: 12, reps_max: 12, rest: 0, notes: "Élastique genoux" },
        ],
        [
          { name: "Front Squat", sets: 4, reps_min: 5, reps_max: 6, rest: 180, tempo: "2-0-1-0", rpe: "8-9", notes: "Plus de quad, meilleure posture." },
          { name: "Romanian Deadlift (RDL) Barre", sets: 4, reps_min: 8, reps_max: 10, rest: 120, tempo: "3-0-1-1", rpe: "8", notes: "Excentrique 3s." },
        ],
        [
          { name: "Bulgarian Split Squat (haltères)", sets: 3, reps_min: 10, reps_max: 10, rest: 90, tempo: "2-1-1-0", rpe: "8", notes: "10/côté." },
          { name: "Leg Curl", sets: 3, reps_min: 12, reps_max: 15, rest: 60, tempo: "2-0-1-1", rpe: "8", notes: "Contraction lente." },
        ],
        [
          { name: "Mollets debout", sets: 4, reps_min: 15, reps_max: 20, rest: 45, tempo: "1-0-1-2", notes: "Pause 2s stretch en bas. Important pour le running." },
          { name: "Hanging Leg Raise", sets: 3, reps_min: 12, reps_max: 12, rest: 60, notes: "Core solide." },
        ],
        [
          { name: "Étirement quadriceps", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "30s/côté" },
          { name: "Child's Pose", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "Hip Flexor Lunge Stretch 30s/côté" },
        ],
      ];

      const allFExB: any[] = [];
      for (let i = 0; i < fSectionsB!.length; i++) {
        for (let j = 0; j < fExB[i].length; j++) {
          const e = fExB[i][j];
          allFExB.push({
            session_id: fSessionB!.id, section_id: fSectionsB![i].id,
            exercise_id: findExercise(e.name), sort_order: j,
            sets: e.sets, reps_min: e.reps_min, reps_max: e.reps_max, rest_seconds: e.rest,
            tempo: (e as any).tempo || null, rpe_target: (e as any).rpe || null, coach_notes: e.notes,
          });
        }
      }
      await supabase.from("session_exercises").insert(allFExB);

      // ── Session C: HYROX Prep (Friday = 5)
      const { data: fSessionC } = await supabase.from("sessions").insert({
        week_id: franckWeek!.id, day_of_week: 5, name: "HYROX Prep — Stations + Conditioning",
        notes: "Simulation stations HYROX + intervals running + core sous fatigue."
      }).select().single();

      const fSecC = [
        { name: "WARM-UP", icon: "🔥", sort_order: 0, duration_estimate: "5 min", notes: "Running + dynamique." },
        { name: "BLOC A — Stations HYROX", icon: "🏋️", sort_order: 1, duration_estimate: "25 min", notes: "Circuit 3 tours. 2 min repos entre tours." },
        { name: "BLOC B — Running intervals", icon: "🏃", sort_order: 2, duration_estimate: "12 min", notes: "6× (1min fast + 1min récup)." },
        { name: "BLOC C — Core sous fatigue", icon: "🎯", sort_order: 3, duration_estimate: "5 min", notes: "Core quand tu es fatigué." },
        { name: "COOL-DOWN", icon: "🧘", sort_order: 4, duration_estimate: "3 min", notes: "Marche + étirements." },
      ];
      const { data: fSectionsC } = await supabase.from("session_sections")
        .insert(fSecC.map(s => ({ ...s, session_id: fSessionC!.id }))).select().order("sort_order");

      const fExC = [
        [
          { name: "Running Treadmill", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "3 min @ 5:00/km" },
          { name: "Inchworm", sets: 1, reps_min: 5, reps_max: 5, rest: 0, notes: "5 reps" },
          { name: "Jumping Jacks", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "30s" },
        ],
        [
          { name: "SkiErg", sets: 3, reps_min: 1, reps_max: 1, rest: 30, notes: "500m/tour. Rythme course." },
          { name: "Wall Balls", sets: 3, reps_min: 15, reps_max: 15, rest: 30, notes: "9kg. 15 reps/tour." },
          { name: "Burpee Broad Jump", sets: 3, reps_min: 10, reps_max: 10, rest: 30, notes: "10 reps/tour." },
          { name: "Farmers Carry", sets: 3, reps_min: 1, reps_max: 1, rest: 120, notes: "40m. 2×24kg KB. 2min repos après tour." },
        ],
        [
          { name: "Running Treadmill", sets: 6, reps_min: 1, reps_max: 1, rest: 60, notes: "1min @4:15/km + 1min @6:00/km récup. ×6" },
        ],
        [
          { name: "Planche", sets: 3, reps_min: 1, reps_max: 1, rest: 30, notes: "45s hold" },
          { name: "Russian Twist", sets: 3, reps_min: 20, reps_max: 20, rest: 30, notes: "20 reps" },
        ],
        [
          { name: "Marche", sets: 1, reps_min: 1, reps_max: 1, rest: 0, notes: "2 min retour au calme" },
        ],
      ];

      const allFExC: any[] = [];
      for (let i = 0; i < fSectionsC!.length; i++) {
        for (let j = 0; j < fExC[i].length; j++) {
          const e = fExC[i][j];
          allFExC.push({
            session_id: fSessionC!.id, section_id: fSectionsC![i].id,
            exercise_id: findExercise(e.name), sort_order: j,
            sets: e.sets, reps_min: e.reps_min, reps_max: e.reps_max, rest_seconds: e.rest,
            tempo: (e as any).tempo || null, rpe_target: (e as any).rpe || null, coach_notes: e.notes,
          });
        }
      }
      await supabase.from("session_exercises").insert(allFExC);

      // Franck progression
      await supabase.from("program_progression").insert([
        { program_id: franckProgram!.id, week_label: "Semaines 1-3", description: "Mise en place, ajuster charges et volume cardio", week_start: 1, week_end: 3, is_deload: false, sort_order: 0 },
        { program_id: franckProgram!.id, week_label: "Semaines 4-6", description: "Surcharge progressive + augmenter pace running 5-10s/km", week_start: 4, week_end: 6, is_deload: false, sort_order: 1 },
        { program_id: franckProgram!.id, week_label: "Semaines 7-8", description: "Peak — séances les plus intenses", week_start: 7, week_end: 8, is_deload: false, sort_order: 2 },
        { program_id: franckProgram!.id, week_label: "Semaine 9", description: "DELOAD — 50% charges, running léger uniquement", week_start: 9, week_end: 9, is_deload: true, sort_order: 3 },
        { program_id: franckProgram!.id, week_label: "Semaine 10", description: "Test — HYROX simulation complète ou semi-marathon test", week_start: 10, week_end: 10, is_deload: false, sort_order: 4 },
      ]);

      console.log("Franck-Athlete's program created");
    }

    // ─── 11. Nutrition profiles ───
    const nutritionProfiles = [
      { student_id: yanaId, sex: "female", age: 28, height_cm: 165, weight_kg: 55, activity_multiplier: 1.6, bmr: 1300, tdee: 2080, objective: "recomp", calorie_target: 2080, protein_g: 121, fat_g: 50, carbs_g: 240 },
      { student_id: maximeId, sex: "male", age: 26, height_cm: 182, weight_kg: 75, activity_multiplier: 1.55, bmr: 1780, tdee: 2760, objective: "muscle_gain", calorie_target: 3110, protein_g: 150, fat_g: 75, carbs_g: 440 },
      { student_id: franckAthleteId, sex: "male", age: 30, height_cm: 170, weight_kg: 75, activity_multiplier: 1.8, bmr: 1700, tdee: 3060, objective: "fat_loss", calorie_target: 2760, protein_g: 165, fat_g: 68, carbs_g: 358 },
    ];

    for (const np of nutritionProfiles) {
      const { data: existing } = await supabase.from("nutrition_profiles")
        .select("id").eq("student_id", np.student_id).limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from("nutrition_profiles").insert(np);
      }
    }

    // ─── 12. External sessions (this week) ───
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // Monday
    const dateStr = (d: Date, offset: number) => {
      const dt = new Date(d);
      dt.setDate(dt.getDate() + offset);
      return dt.toISOString().split("T")[0];
    };

    const externalSessions = [
      // Yana
      { student_id: yanaId, date: dateStr(monday, 0), activity_type: "pilates", activity_label: "Pilates", duration_minutes: 60, intensity_perceived: 4, location: "Episod", muscle_groups_involved: ["core", "fessiers"] },
      { student_id: yanaId, date: dateStr(monday, 2), activity_type: "hiit", activity_label: "HIIT Circuit", duration_minutes: 45, intensity_perceived: 8, location: "Episod", muscle_groups_involved: ["full_body"] },
      { student_id: yanaId, date: dateStr(monday, 4), activity_type: "cycling", activity_label: "Cycling RPM", duration_minutes: 45, intensity_perceived: 7, location: "CMG", muscle_groups_involved: ["jambes", "cardio"] },
      { student_id: yanaId, date: dateStr(monday, 6), activity_type: "running", activity_label: "Running", duration_minutes: 40, intensity_perceived: 5, location: "Extérieur", muscle_groups_involved: ["cardio", "jambes"] },
      // Maxime
      { student_id: maximeId, date: dateStr(monday, 3), activity_type: "running", activity_label: "Running", duration_minutes: 35, intensity_perceived: 6, location: "Extérieur", muscle_groups_involved: ["cardio", "jambes"], notes: "5-7 km rythme confortable" },
      { student_id: maximeId, date: dateStr(monday, 5), activity_type: "cycling", activity_label: "Vélo route", duration_minutes: 75, intensity_perceived: 5, location: "Extérieur", muscle_groups_involved: ["jambes", "cardio"] },
      // Franck-Athlete
      { student_id: franckAthleteId, date: dateStr(monday, 1), activity_type: "running", activity_label: "Running tempo", duration_minutes: 45, intensity_perceived: 7, location: "Extérieur", muscle_groups_involved: ["cardio", "jambes"], notes: "8-10 km @ 5:00/km" },
      { student_id: franckAthleteId, date: dateStr(monday, 3), activity_type: "bootcamp", activity_label: "Bootcamp Athletic", duration_minutes: 60, intensity_perceived: 8, location: "Episod Bastille", muscle_groups_involved: ["full_body"] },
      { student_id: franckAthleteId, date: dateStr(monday, 5), activity_type: "running", activity_label: "Running long", duration_minutes: 60, intensity_perceived: 6, location: "Extérieur", muscle_groups_involved: ["cardio", "jambes"], notes: "12-14 km @ 5:20/km" },
    ];

    for (const es of externalSessions) {
      const { data: existing } = await supabase.from("external_sessions")
        .select("id").eq("student_id", es.student_id).eq("date", es.date).eq("activity_type", es.activity_type).limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from("external_sessions").insert(es);
      }
    }

    // ─── 13. Weekly check-ins ───
    const weekStart = dateStr(monday, 0);
    const checkins = [
      { student_id: yanaId, week_start: weekStart, energy_level: 4, sleep_quality: 4, stress_level: 2, muscle_soreness: 2 },
      { student_id: maximeId, week_start: weekStart, energy_level: 4, sleep_quality: 3, stress_level: 3, muscle_soreness: 3, soreness_location: ["jambes"], general_notes: "Les jambes tirent un peu du deadlift de mercredi" },
      { student_id: franckAthleteId, week_start: weekStart, energy_level: 3, sleep_quality: 3, stress_level: 3, muscle_soreness: 3, soreness_location: ["jambes", "épaules"], general_notes: "Semaine chargée au boulot, j'ai quand même fait toutes mes séances. Les jambes sont raides du front squat." },
    ];

    for (const ci of checkins) {
      const { data: existing } = await supabase.from("weekly_checkins")
        .select("id").eq("student_id", ci.student_id).eq("week_start", ci.week_start).limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from("weekly_checkins").insert(ci);
      }
    }

    console.log("Seed complete!");

    return new Response(JSON.stringify({
      message: "3 athlete personas seeded successfully",
      athletes: { yana: yanaId, maxime: maximeId, franck: franckAthleteId },
      coach: coachUserId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Seed error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
