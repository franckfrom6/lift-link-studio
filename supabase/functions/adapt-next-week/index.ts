import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
      .select("full_name, goal, level")
      .eq("user_id", student_id)
      .single();

    // Fetch program info
    const { data: program } = await supabase
      .from("programs")
      .select("name")
      .eq("id", program_id)
      .single();

    // Fetch completed sessions this week with feedback
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

    const prompt = `You are an experienced strength coach. Analyze the weekly feedback for ${profile?.full_name || "this athlete"} and suggest adaptations for next week. Respond in ${lang}.

ATHLETE PROFILE:
- Level: ${profile?.level || "Intermediate"}
- Goal: ${profile?.goal || "General fitness"}

PROGRAM: ${program?.name || "Current program"} — Week ${week_number}

FEEDBACKS THIS WEEK (${feedbacks.length} sessions):
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
${checkin ? `Energy: ${checkin.energy_level}/5, Sleep: ${checkin.sleep_quality}/5, Stress: ${checkin.stress_level}/5, Soreness: ${checkin.muscle_soreness}/5` : "No check-in this week"}

Average rating this week: ${avgRating.toFixed(1)}/5

Generate adaptation recommendations in JSON format with this structure:
{
  "weekly_summary": "2-3 sentence summary",
  "load_assessment": "under_stimulated" | "optimal" | "slightly_high" | "overreaching",
  "adaptations": [{ "type": "increase_load|decrease_load|swap_exercise|adjust_volume|adjust_rest|deload_suggestion|pain_alert", "detail": "...", "reason": "...", "priority": "high|medium|low" }],
  "pain_alerts": [{ "location": "...", "recommendation": "...", "should_see_professional": true/false }],
  "progression_suggestion": "...",
  "coach_message_suggestion": "A message the coach could send to the athlete"
}

RULES:
- If avg rating ≤ 2 → suggest increasing loads by 2.5-5kg
- If avg rating ≥ 4 → suggest reducing volume 10-15% or adding rest
- If joint discomfort reported → ALWAYS flag it as priority high
- Never ignore joint pain
- Be specific with weight suggestions in kg`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert strength and conditioning coach AI. Always respond with valid JSON only." },
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
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { weekly_summary: content, load_assessment: "optimal", adaptations: [], pain_alerts: [] };
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
