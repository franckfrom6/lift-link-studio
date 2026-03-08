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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { student_id, lang } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get student profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, goal, level")
      .eq("user_id", student_id)
      .maybeSingle();

    const name = profile?.full_name || "Athlete";

    // Current week boundaries
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const wsStr = monday.toISOString().split("T")[0];
    const weStr = sunday.toISOString().split("T")[0];

    // Previous week
    const prevMonday = new Date(monday);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const prevSunday = new Date(monday);
    prevSunday.setDate(prevSunday.getDate() - 1);
    prevSunday.setHours(23, 59, 59, 999);

    // Completed sessions this week
    const { data: sessions } = await supabase
      .from("completed_sessions")
      .select("id")
      .eq("student_id", student_id)
      .gte("started_at", monday.toISOString())
      .lte("started_at", sunday.toISOString());

    // Completed sessions last week
    const { data: prevSessions } = await supabase
      .from("completed_sessions")
      .select("id")
      .eq("student_id", student_id)
      .gte("started_at", prevMonday.toISOString())
      .lte("started_at", prevSunday.toISOString());

    // Volume this week
    let volumeThisWeek = 0;
    if (sessions && sessions.length > 0) {
      const { data: sets } = await supabase
        .from("completed_sets")
        .select("weight, reps")
        .in("completed_session_id", sessions.map(s => s.id));
      if (sets) volumeThisWeek = sets.reduce((s, r) => s + (r.weight || 0) * r.reps, 0);
    }

    // Volume last week
    let volumeLastWeek = 0;
    if (prevSessions && prevSessions.length > 0) {
      const { data: prevSets } = await supabase
        .from("completed_sets")
        .select("weight, reps")
        .in("completed_session_id", prevSessions.map(s => s.id));
      if (prevSets) volumeLastWeek = prevSets.reduce((s, r) => s + (r.weight || 0) * r.reps, 0);
    }

    const volumeDelta = volumeLastWeek > 0
      ? Math.round(((volumeThisWeek - volumeLastWeek) / volumeLastWeek) * 100)
      : 0;

    // Programmed sessions
    const { data: programs } = await supabase
      .from("programs")
      .select("id")
      .eq("student_id", student_id)
      .eq("status", "active")
      .limit(1);

    let programmedTotal = 0;
    if (programs && programs.length > 0) {
      const { data: weeks } = await supabase
        .from("program_weeks")
        .select("id")
        .eq("program_id", programs[0].id)
        .limit(1);
      if (weeks && weeks.length > 0) {
        const { count } = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("week_id", weeks[0].id);
        programmedTotal = count || 0;
      }
    }

    // Check-in
    const { data: checkins } = await supabase
      .from("weekly_checkins")
      .select("energy_level, sleep_quality, stress_level, muscle_soreness")
      .eq("student_id", student_id)
      .gte("week_start", wsStr)
      .lte("week_start", weStr)
      .limit(1);

    const checkin = checkins?.[0];

    // Nutrition
    const { data: nutritionLogs } = await supabase
      .from("daily_nutrition_logs")
      .select("date")
      .eq("student_id", student_id)
      .gte("date", wsStr)
      .lte("date", weStr);
    const daysLogged = new Set(nutritionLogs?.map(l => l.date)).size;

    // Nutrition profile for adherence
    const { data: nutritionProfile } = await supabase
      .from("nutrition_profiles")
      .select("calorie_target")
      .eq("student_id", student_id)
      .maybeSingle();

    const langInstruction = lang === "fr" ? "Réponds en français." : "Respond in English.";

    const prompt = `${langInstruction}
Résumé rapide de la semaine passée pour ${name} :
- Séances faites : ${sessions?.length || 0}/${programmedTotal}
- Volume total : ${Math.round(volumeThisWeek)} kg (vs semaine précédente : ${volumeDelta > 0 ? "+" : ""}${volumeDelta}%)
- Check-in : énergie ${checkin?.energy_level ?? "N/A"}, sommeil ${checkin?.sleep_quality ?? "N/A"}, stress ${checkin?.stress_level ?? "N/A"}, courbatures ${checkin?.muscle_soreness ?? "N/A"}
- Nutrition : ${daysLogged} repas loggués cette semaine

Génère un message court (3-4 phrases max), encourageant et concret :
- Souligne un point positif
- Donne un conseil actionnable pour la semaine à venir
- Ton : coach bienveillant mais exigeant, pas de bullshit motivationnel générique`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a personal fitness coach giving a short weekly recap to your athlete." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "weekly_insight",
              description: "Return a short weekly insight message with emoji",
              parameters: {
                type: "object",
                properties: {
                  message: { type: "string", description: "3-4 sentence motivational recap" },
                  emoji: { type: "string", description: "A single relevant emoji" },
                },
                required: ["message", "emoji"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "weekly_insight" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let insight;
    if (toolCall?.function?.arguments) {
      insight = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      throw new Error("No structured output from AI");
    }

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-insight error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
