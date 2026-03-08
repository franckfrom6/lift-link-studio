import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { student_id, date_start, date_end, lang } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch student profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", student_id)
      .single();

    const studentName = profile?.full_name || "Élève";
    const studentLevel = profile?.level || "intermédiaire";
    const studentGoal = profile?.goal || "remise en forme";

    // Fetch completed sessions in period
    const { data: completedSessions } = await supabase
      .from("completed_sessions")
      .select("*, completed_sets(*)")
      .eq("student_id", student_id)
      .gte("started_at", date_start)
      .lte("started_at", date_end + "T23:59:59");

    // Fetch programmed sessions count
    const { data: programs } = await supabase
      .from("programs")
      .select("id, name, program_weeks(id, sessions(id))")
      .eq("student_id", student_id)
      .eq("status", "active");

    let totalProgrammedSessions = 0;
    programs?.forEach(p => {
      p.program_weeks?.forEach((w: any) => {
        totalProgrammedSessions += w.sessions?.length || 0;
      });
    });

    // Calculate total volume
    let totalVolume = 0;
    completedSessions?.forEach(s => {
      s.completed_sets?.forEach((set: any) => {
        totalVolume += (set.weight || 0) * (set.reps || 0);
      });
    });

    // Fetch external sessions
    const { data: externals } = await supabase
      .from("external_sessions")
      .select("*")
      .eq("student_id", student_id)
      .gte("date", date_start)
      .lte("date", date_end);

    const externalBreakdown: Record<string, number> = {};
    externals?.forEach(e => {
      externalBreakdown[e.activity_type] = (externalBreakdown[e.activity_type] || 0) + 1;
    });

    // Fetch swaps
    const { data: swaps } = await supabase
      .from("session_swaps")
      .select("*")
      .eq("student_id", student_id)
      .gte("created_at", date_start)
      .lte("created_at", date_end + "T23:59:59");

    // Fetch body measurements
    const { data: measurements } = await supabase
      .from("body_measurements")
      .select("*")
      .eq("student_id", student_id)
      .gte("date", date_start)
      .lte("date", date_end)
      .order("date", { ascending: true });

    const firstMeasure = measurements?.[0];
    const lastMeasure = measurements?.[measurements.length - 1];

    // Fetch nutrition logs
    const { data: nutritionLogs } = await supabase
      .from("daily_nutrition_logs")
      .select("*")
      .eq("student_id", student_id)
      .gte("date", date_start)
      .lte("date", date_end);

    // Fetch nutrition profile for targets
    const { data: nutritionProfile } = await supabase
      .from("nutrition_profiles")
      .select("*")
      .eq("student_id", student_id)
      .single();

    // Calculate nutrition averages
    const dateSet = new Set(nutritionLogs?.map(l => l.date));
    const daysLogged = dateSet.size;
    const totalDays = Math.ceil((new Date(date_end).getTime() - new Date(date_start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    let avgProtein = 0, avgCarbs = 0, avgFat = 0;
    if (nutritionLogs && nutritionLogs.length > 0) {
      avgProtein = Math.round(nutritionLogs.reduce((s, l) => s + (l.protein_g || 0), 0) / daysLogged);
      avgCarbs = Math.round(nutritionLogs.reduce((s, l) => s + (l.carbs_g || 0), 0) / daysLogged);
      avgFat = Math.round(nutritionLogs.reduce((s, l) => s + (l.fat_g || 0), 0) / daysLogged);
    }

    // Fetch weekly checkins
    const { data: checkins } = await supabase
      .from("weekly_checkins")
      .select("*")
      .eq("student_id", student_id)
      .gte("week_start", date_start)
      .lte("week_start", date_end)
      .order("week_start", { ascending: true });

    const avgEnergy = checkins && checkins.length > 0
      ? (checkins.reduce((s, c) => s + c.energy_level, 0) / checkins.length).toFixed(1)
      : "N/A";
    const avgSleep = checkins && checkins.length > 0
      ? (checkins.reduce((s, c) => s + c.sleep_quality, 0) / checkins.length).toFixed(1)
      : "N/A";
    const avgStress = checkins && checkins.length > 0
      ? (checkins.reduce((s, c) => s + c.stress_level, 0) / checkins.length).toFixed(1)
      : "N/A";
    const avgSoreness = checkins && checkins.length > 0
      ? (checkins.reduce((s, c) => s + c.muscle_soreness, 0) / checkins.length).toFixed(1)
      : "N/A";

    const weeks = Math.ceil(totalDays / 7);
    const adherenceRate = totalProgrammedSessions > 0
      ? Math.round(((completedSessions?.length || 0) / totalProgrammedSessions) * 100)
      : 0;

    const langInstruction = lang === 'fr' ? 'Réponds en français.' : 'Respond in English.';

    const prompt = `${langInstruction}
Génère un bilan de fin de cycle pour ${studentName} (${studentLevel}, objectif : ${studentGoal}).
Période : ${date_start} → ${date_end} (${weeks} semaines).

DONNÉES D'ENTRAÎNEMENT :
- Séances programmées complétées : ${completedSessions?.length || 0}/${totalProgrammedSessions} (taux assiduité ${adherenceRate}%)
- Séances externes loguées : ${externals?.length || 0} (types : ${JSON.stringify(externalBreakdown)})
- Volume total soulevé sur la période : ${totalVolume} kg
- Séances déplacées : ${swaps?.length || 0}

DONNÉES CORPORELLES :
- Poids : ${firstMeasure?.weight_kg ?? 'N/A'} → ${lastMeasure?.weight_kg ?? 'N/A'} kg
- Tour de taille : ${firstMeasure?.waist_cm ?? 'N/A'} → ${lastMeasure?.waist_cm ?? 'N/A'} cm

DONNÉES NUTRITION :
- Jours avec repas loggués : ${daysLogged}/${totalDays} (${totalDays > 0 ? Math.round((daysLogged / totalDays) * 100) : 0}%)
- Moyennes macros : P ${avgProtein}g / C ${avgCarbs}g / L ${avgFat}g vs objectifs P ${nutritionProfile?.protein_g ?? 'N/A'}g / C ${nutritionProfile?.carbs_g ?? 'N/A'}g / L ${nutritionProfile?.fat_g ?? 'N/A'}g

DONNÉES CHECK-INS :
- Énergie moyenne : ${avgEnergy}/5
- Sommeil moyen : ${avgSleep}/5
- Stress moyen : ${avgStress}/5
- Courbatures moyenne : ${avgSoreness}/5`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional sports coach assistant. Generate detailed, actionable cycle reports." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_bilan",
              description: "Generate a structured end-of-cycle report",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "3-4 sentence summary of the cycle" },
                  highlights: { type: "array", items: { type: "string" }, description: "3 positive points" },
                  areas_to_improve: { type: "array", items: { type: "string" }, description: "2-3 areas to improve" },
                  strength_progress: {
                    type: "object",
                    properties: {
                      assessment: { type: "string", enum: ["excellent", "bon", "stagnant", "régression"] },
                      detail: { type: "string" },
                    },
                    required: ["assessment", "detail"],
                  },
                  nutrition_assessment: {
                    type: "object",
                    properties: {
                      adherence: { type: "string", enum: ["excellent", "bon", "insuffisant"] },
                      detail: { type: "string" },
                    },
                    required: ["adherence", "detail"],
                  },
                  recovery_assessment: {
                    type: "object",
                    properties: { detail: { type: "string" } },
                    required: ["detail"],
                  },
                  next_cycle_recommendations: { type: "array", items: { type: "string" }, description: "3 recommendations" },
                  suggested_program_adjustments: { type: "string" },
                  coach_talking_points: { type: "array", items: { type: "string" }, description: "3 talking points" },
                },
                required: ["summary", "highlights", "areas_to_improve", "strength_progress", "nutrition_assessment", "recovery_assessment", "next_cycle_recommendations", "suggested_program_adjustments", "coach_talking_points"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_bilan" } },
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
    let bilan;
    if (toolCall?.function?.arguments) {
      bilan = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      throw new Error("No structured output from AI");
    }

    // Add raw data alongside AI analysis
    const result = {
      bilan,
      raw_data: {
        student_name: studentName,
        student_level: studentLevel,
        student_goal: studentGoal,
        date_start,
        date_end,
        weeks,
        sessions_completed: completedSessions?.length || 0,
        sessions_programmed: totalProgrammedSessions,
        adherence_rate: adherenceRate,
        external_count: externals?.length || 0,
        external_breakdown: externalBreakdown,
        total_volume: totalVolume,
        swaps_count: swaps?.length || 0,
        weight_start: firstMeasure?.weight_kg,
        weight_end: lastMeasure?.weight_kg,
        days_logged: daysLogged,
        total_days: totalDays,
        avg_macros: { protein: avgProtein, carbs: avgCarbs, fat: avgFat },
        target_macros: {
          protein: nutritionProfile?.protein_g,
          carbs: nutritionProfile?.carbs_g,
          fat: nutritionProfile?.fat_g,
        },
        avg_energy: avgEnergy,
        avg_sleep: avgSleep,
        avg_stress: avgStress,
        avg_soreness: avgSoreness,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-bilan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
