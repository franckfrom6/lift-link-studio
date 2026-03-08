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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { student_id, program_id, week_number, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch student profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, goal, level, age, weight, height")
      .eq("user_id", student_id)
      .single();

    // Fetch program info
    const { data: program } = await supabase
      .from("programs")
      .select("name")
      .eq("id", program_id)
      .single();

    // Fetch current week structure (last week with exercises)
    const { data: weeks } = await supabase
      .from("program_weeks")
      .select("id, week_number")
      .eq("program_id", program_id)
      .order("week_number", { ascending: false })
      .limit(1);

    let currentWeekStructure = "";
    if (weeks && weeks.length > 0) {
      const weekId = weeks[0].id;
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, name, day_of_week, notes")
        .eq("week_id", weekId)
        .order("day_of_week");

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          const { data: sections } = await supabase
            .from("session_sections")
            .select("id, name, sort_order")
            .eq("session_id", session.id)
            .order("sort_order");

          currentWeekStructure += `\nSESSION: ${session.name} (Day ${session.day_of_week})\n`;
          
          if (sections) {
            for (const section of sections) {
              const { data: exercises } = await supabase
                .from("session_exercises")
                .select("*, exercise:exercises(name, muscle_group, equipment)")
                .eq("section_id", section.id)
                .order("sort_order");

              currentWeekStructure += `  SECTION: ${section.name}\n`;
              if (exercises) {
                for (const ex of exercises) {
                  const e = (ex as any).exercise;
                  currentWeekStructure += `    - ${e?.name || "?"} (${e?.muscle_group || "?"}) — ${ex.sets}x${ex.reps_min}-${ex.reps_max} RPE:${ex.rpe_target || "N/A"} Rest:${ex.rest_seconds}s\n`;
                }
              }
            }
          }
        }
      }
    }

    // Fetch available exercises from the coach's library
    const { data: coachExercises } = await supabase
      .from("exercises")
      .select("name, muscle_group, equipment, type")
      .or(`is_default.eq.true,created_by.eq.${(await supabase.from("programs").select("coach_id").eq("id", program_id).single()).data?.coach_id}`)
      .limit(200);

    const exerciseCatalog = coachExercises?.map(e => `${e.name} (${e.muscle_group}, ${e.equipment})`).join(", ") || "";

    // Fetch completed sessions with feedback
    const { data: completedSessions } = await supabase
      .from("completed_sessions")
      .select("*, session_feedback(*)")
      .eq("student_id", student_id)
      .order("started_at", { ascending: false })
      .limit(10);

    // Fetch weekly checkin
    const { data: checkins } = await supabase
      .from("weekly_checkins")
      .select("*")
      .eq("student_id", student_id)
      .order("week_start", { ascending: false })
      .limit(1);

    const checkin = checkins?.[0];
    const feedbacks = completedSessions
      ?.filter((s: any) => s.session_feedback?.length > 0)
      .map((s: any) => s.session_feedback[0]) || [];

    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((a: number, f: any) => a + f.overall_rating, 0) / feedbacks.length
      : 3;

    const lang = language === "en" ? "English" : "French";

    const prompt = `You are an experienced strength & conditioning coach. Based on all the data below, generate an ADAPTED PROGRAM for next week. Respond in ${lang}.

ATHLETE PROFILE:
- Name: ${profile?.full_name || "Athlete"}
- Level: ${profile?.level || "Intermediate"}
- Goal: ${profile?.goal || "General fitness"}
- Age: ${profile?.age || "N/A"}, Weight: ${profile?.weight || "N/A"}kg, Height: ${profile?.height || "N/A"}cm

CURRENT PROGRAM: ${program?.name || "Current program"} — Week ${week_number}
${currentWeekStructure || "No current week structure available"}

SESSION FEEDBACKS (${feedbacks.length} sessions):
${feedbacks.map((f: any) => `
- Rating: ${f.overall_rating}/5
- Energy post: ${f.energy_post || "N/A"}/5
- Joint discomfort: ${f.joint_discomfort ? "YES — " + (f.joint_discomfort_location?.join(", ") || "unspecified") : "No"}
- Exercises too easy: ${f.exercises_too_easy?.join(", ") || "None"}
- Exercises too hard: ${f.exercises_too_hard?.join(", ") || "None"}
- Exercises with pain: ${f.exercises_pain?.join(", ") || "None"}
- Mood: ${f.mood_after || "N/A"}
- Would repeat: ${f.would_repeat ? "Yes" : "No"}
- Comment: "${f.free_comment || ""}"
`).join("\n")}

WEEKLY CHECK-IN:
${checkin ? `Energy: ${checkin.energy_level}/5, Sleep: ${checkin.sleep_quality}/5, Stress: ${checkin.stress_level}/5, Soreness: ${checkin.muscle_soreness}/5
Notes: ${checkin.general_notes || "None"}
Availability: ${checkin.availability_notes || "None"}` : "No check-in this week"}

Average rating: ${avgRating.toFixed(1)}/5

AVAILABLE EXERCISES (use only these names): ${exerciseCatalog}

Generate a complete adapted week program in JSON:
{
  "weekly_summary": "2-3 sentence analysis and rationale for changes",
  "load_assessment": "under_stimulated" | "optimal" | "slightly_high" | "overreaching",
  "key_changes": ["Change 1 explanation", "Change 2 explanation"],
  "pain_alerts": [{ "location": "...", "recommendation": "...", "should_see_professional": true/false }],
  "proposed_sessions": [
    {
      "name": "Session name",
      "day_of_week": 1,
      "notes": "Coach notes for this session",
      "sections": [
        {
          "name": "WARM-UP",
          "exercises": [
            { "name": "Exercise name (MUST be from available exercises list)", "sets": 3, "reps_min": 8, "reps_max": 12, "rest_seconds": 90, "rpe_target": "8", "coach_notes": "optional note" }
          ]
        }
      ]
    }
  ],
  "coach_message_suggestion": "A motivational message the coach could send to the athlete, referencing the feedback"
}

RULES:
- Generate 2-4 sessions depending on athlete availability and feedback
- If athlete requests specific training styles (e.g. Hyrox, running), ADAPT the program to include those
- If athlete mentions time constraints or travel, reduce session count or duration  
- If avg rating ≤ 2 → increase loads 2.5-5kg on compound lifts
- If avg rating ≥ 4 → reduce volume 10-15% or add rest
- If joint discomfort → swap exercises for joint-friendly alternatives, flag as pain alert
- Use ONLY exercise names from the available exercises list
- Include warm-up and cool-down sections
- Be specific with sets, reps, RPE targets
- Respond with valid JSON only`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert strength and conditioning coach AI. Always respond with valid JSON only. No markdown code blocks." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error: " + aiResponse.status);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { weekly_summary: content, load_assessment: "optimal", key_changes: [], pain_alerts: [], proposed_sessions: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("adapt-next-week error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
