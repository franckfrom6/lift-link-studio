import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "https://lift-link-studio.lovable.app",
  "https://fit.from6agency.com",
  "https://id-preview--0363201d-a29c-474b-ab98-106ca7fb6ee7.lovable.app",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

// Rate limits per plan (per month, -1 = unlimited)
const RATE_LIMITS: Record<string, Record<string, number>> = {
  free: {},
  essential: {
    generate_program: 5,
    suggest_alternatives: 30,
    suggest_exercise: 30,
    estimate_macros: 60,
    recovery_recommendation: 30,
    generate_recommendation: 20,
    chat: 30,
  },
  advanced: {
    generate_program: 50,
    suggest_alternatives: -1,
    suggest_exercise: -1,
    analyze_week: 30,
    cycle_report: 10,
    optimize_week: 30,
    estimate_macros: -1,
    suggest_meal: -1,
    recovery_recommendation: -1,
    weekly_insight: -1,
    generate_recommendation: -1,
    chat: -1,
  },
};

const MIN_PLAN_FOR_ACTION: Record<string, string> = {
  generate_program: "essential",
  suggest_alternatives: "essential",
  suggest_exercise: "essential",
  estimate_macros: "essential",
  recovery_recommendation: "essential",
  generate_recommendation: "essential",
  chat: "essential",
  analyze_week: "advanced",
  cycle_report: "advanced",
  optimize_week: "advanced",
  suggest_meal: "advanced",
  weekly_insight: "advanced",
};

// Model selection per action complexity
const MODEL_FOR_ACTION: Record<string, string> = {
  generate_program: "google/gemini-2.5-flash",
  cycle_report: "google/gemini-2.5-flash",
  analyze_week: "google/gemini-2.5-flash",
  optimize_week: "google/gemini-2.5-flash",
  chat: "claude-opus-4-5",
  suggest_alternatives: "google/gemini-2.5-flash-lite",
  suggest_exercise: "google/gemini-2.5-flash-lite",
  estimate_macros: "google/gemini-2.5-flash-lite",
  suggest_meal: "google/gemini-2.5-flash-lite",
  recovery_recommendation: "google/gemini-2.5-flash-lite",
  weekly_insight: "google/gemini-2.5-flash-lite",
  generate_recommendation: "google/gemini-2.5-flash-lite",
};

async function callLovableAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  tools?: any[],
  toolChoice?: any
) {
  const body: any = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = toolChoice;
  }

  const start = Date.now();
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const durationMs = Date.now() - start;

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI gateway error:", response.status, errText);
    return { error: true, status: response.status, durationMs, errText };
  }

  const data = await response.json();
  const usage = data.usage || {};
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  const content = data.choices?.[0]?.message?.content || "";

  let result: any;
  if (toolCall?.function?.arguments) {
    result = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
  } else if (content) {
    // Try parsing JSON from content
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      result = JSON.parse(cleaned);
    } catch {
      result = { text: content };
    }
  }

  return {
    error: false,
    result,
    inputTokens: usage.prompt_tokens || null,
    outputTokens: usage.completion_tokens || null,
    durationMs,
  };
}

// ── Action handlers ──────────────────────────────────────────────

function buildGenerateProgram(payload: any, lang: string) {
  const l = lang === "fr" ? "français" : "anglais";
  const system = `Tu es un coach sportif expert en programmation d'entraînement. Tu génères des programmes structurés et détaillés. Réponds en ${l}.`;
  let user: string;
  if (payload.structured) {
    const s = payload.structured;
    user = `Génère un programme d'entraînement :\n- Objectif : ${s.objective || "Non spécifié"}\n- Niveau : ${s.level || "Intermédiaire"}\n- Fréquence : ${s.frequency || "3x/semaine"}\n- Durée par séance : ${s.duration || "1h"}\n- Équipement : ${s.equipment || "Salle complète"}\n- Contraintes : ${s.notes || "Aucune"}\n${payload.prompt ? `\nInstructions : ${payload.prompt}` : ""}`;
  } else {
    user = payload.prompt;
  }
  const tools = [{
    type: "function",
    function: {
      name: "generate_program",
      description: "Generate a structured training program",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          objective: { type: "string" },
          duration_weeks: { type: "number" },
          weeks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week_number: { type: "number" },
                sessions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      day_of_week: { type: "number" },
                      sections: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            icon: { type: "string" },
                            duration_estimate: { type: "string" },
                            notes: { type: "string" },
                            exercises: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string" },
                                  sets: { type: "number" },
                                  reps_min: { type: "number" },
                                  reps_max: { type: "number" },
                                  tempo: { type: "string" },
                                  rest_seconds: { type: "number" },
                                  rpe_target: { type: "string" },
                                  suggested_weight: { type: "number" },
                                  coach_notes: { type: "string" },
                                  video_url: { type: "string" },
                                  video_search_query: { type: "string" },
                                },
                                required: ["name", "sets", "reps_min", "reps_max", "rest_seconds"],
                                additionalProperties: false,
                              },
                            },
                          },
                          required: ["name", "exercises"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["name", "day_of_week", "sections"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["week_number", "sessions"],
              additionalProperties: false,
            },
          },
          progression: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week_label: { type: "string" },
                description: { type: "string" },
                week_start: { type: "number" },
                week_end: { type: "number" },
                is_deload: { type: "boolean" },
              },
              required: ["week_label", "description", "week_start", "week_end"],
              additionalProperties: false,
            },
          },
        },
        required: ["name", "objective", "duration_weeks", "weeks"],
        additionalProperties: false,
      },
    },
  }];
  return { system, user, tools, toolChoice: { type: "function", function: { name: "generate_program" } } };
}

function buildCycleReport(payload: any, lang: string) {
  const l = lang === "fr" ? "Réponds en français." : "Respond in English.";
  const system = "You are a professional sports coach assistant. Generate detailed, actionable cycle reports.";
  const user = `${l}\nGénère un bilan de fin de cycle pour ${payload.student_name || "l'athlète"} (${payload.student_level || "intermédiaire"}, objectif : ${payload.student_goal || "remise en forme"}).\nPériode : ${payload.date_start} → ${payload.date_end}.\n\nDONNÉES :\n${JSON.stringify(payload.data || {}, null, 2)}`;
  const tools = [{
    type: "function",
    function: {
      name: "generate_bilan",
      description: "Generate a structured end-of-cycle report",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
          areas_to_improve: { type: "array", items: { type: "string" } },
          strength_progress: { type: "object", properties: { assessment: { type: "string" }, detail: { type: "string" } }, required: ["assessment", "detail"] },
          nutrition_assessment: { type: "object", properties: { adherence: { type: "string" }, detail: { type: "string" } }, required: ["adherence", "detail"] },
          recovery_assessment: { type: "object", properties: { detail: { type: "string" } }, required: ["detail"] },
          next_cycle_recommendations: { type: "array", items: { type: "string" } },
          suggested_program_adjustments: { type: "string" },
          coach_talking_points: { type: "array", items: { type: "string" } },
        },
        required: ["summary", "highlights", "areas_to_improve", "strength_progress", "nutrition_assessment", "recovery_assessment", "next_cycle_recommendations", "suggested_program_adjustments", "coach_talking_points"],
        additionalProperties: false,
      },
    },
  }];
  return { system, user, tools, toolChoice: { type: "function", function: { name: "generate_bilan" } } };
}

function buildGenerateRecommendation(payload: any, lang: string) {
  const l = lang === "fr" ? "Réponds en français." : "Respond in English.";
  const typeLabel = payload.type === "nutrition" ? "nutritionnelle" : "de récupération";
  const system = "You are a professional sports coach assistant creating actionable recommendations.";
  const user = `${l}\nGénère une recommandation ${typeLabel} pour un coach sportif.\nCatégorie : ${payload.category}\n${payload.student_name ? `Élève cible : ${payload.student_name}.` : "Recommandation globale."}\n${payload.trigger_type && payload.trigger_type !== "always" ? `Contexte : ${payload.trigger_type}. Config : ${JSON.stringify(payload.trigger_config || {})}.` : ""}\n\nGénère un contenu concret et actionnable (2-4 paragraphes).\n${payload.type === "nutrition" ? "Inclus des exemples d'aliments/repas spécifiques." : "Génère un protocole étape par étape avec durées et techniques."}`;
  const tools = [{
    type: "function",
    function: {
      name: "generate_recommendation",
      description: "Generate a coach recommendation with title and content",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["title", "content"],
        additionalProperties: false,
      },
    },
  }];
  return { system, user, tools, toolChoice: { type: "function", function: { name: "generate_recommendation" } } };
}

function buildWeeklyInsight(payload: any, lang: string) {
  const l = lang === "fr" ? "Réponds en français." : "Respond in English.";
  const system = "You are a personal fitness coach giving a short weekly recap to your athlete.";
  const user = `${l}\nRésumé rapide de la semaine pour ${payload.student_name || "l'athlète"} :\n- Séances faites : ${payload.sessions_completed || 0}/${payload.sessions_programmed || 0}\n- Volume total : ${payload.volume || 0} kg (vs semaine précédente : ${payload.volume_delta || 0}%)\n- Check-in : énergie ${payload.energy ?? "N/A"}, sommeil ${payload.sleep ?? "N/A"}, stress ${payload.stress ?? "N/A"}, courbatures ${payload.soreness ?? "N/A"}\n- Nutrition : ${payload.days_logged || 0} repas loggués\n\nGénère un message court (3-4 phrases max), encourageant et concret.`;
  const tools = [{
    type: "function",
    function: {
      name: "weekly_insight",
      description: "Return a short weekly insight message with emoji",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string" },
          emoji: { type: "string" },
        },
        required: ["message", "emoji"],
        additionalProperties: false,
      },
    },
  }];
  return { system, user, tools, toolChoice: { type: "function", function: { name: "weekly_insight" } } };
}

function buildAnalyzeWeek(payload: any, lang: string) {
  const l = lang === "fr" ? "Réponds en français." : "Respond in English.";
  const system = "You are an expert strength and conditioning coach AI. Always respond with valid JSON only.";
  const user = `${l}\nAnalyse les feedbacks de la semaine pour ${payload.student_name || "l'athlète"} (${payload.level || "Intermédiaire"}, objectif : ${payload.goal || "General fitness"}).\n\nProgramme : ${payload.program_name || "Programme actuel"} — Semaine ${payload.week_number || "?"}\n\nFEEDBACKS :\n${JSON.stringify(payload.feedbacks || [], null, 2)}\n\nCHECK-IN :\n${JSON.stringify(payload.checkin || {}, null, 2)}\n\nGénère des recommandations d'adaptation.`;
  const tools = [{
    type: "function",
    function: {
      name: "analyze_week",
      description: "Analyze weekly training data and suggest adaptations",
      parameters: {
        type: "object",
        properties: {
          weekly_summary: { type: "string" },
          load_assessment: { type: "string", enum: ["under_stimulated", "optimal", "slightly_high", "overreaching"] },
          adaptations: { type: "array", items: { type: "object", properties: { type: { type: "string" }, detail: { type: "string" }, reason: { type: "string" }, priority: { type: "string" } }, required: ["type", "detail", "reason", "priority"] } },
          pain_alerts: { type: "array", items: { type: "object", properties: { location: { type: "string" }, recommendation: { type: "string" }, should_see_professional: { type: "boolean" } }, required: ["location", "recommendation"] } },
          progression_suggestion: { type: "string" },
          coach_message_suggestion: { type: "string" },
        },
        required: ["weekly_summary", "load_assessment", "adaptations", "pain_alerts"],
        additionalProperties: false,
      },
    },
  }];
  return { system, user, tools, toolChoice: { type: "function", function: { name: "analyze_week" } } };
}

function buildEstimateMacros(payload: any, lang: string) {
  const l = lang === "fr" ? "Réponds en français." : "Respond in English.";
  const system = "You are a sports nutrition expert. Estimate macronutrients from food descriptions accurately.";
  const user = `${l}\nEstime les macronutriments pour ce repas :\n"${payload.description}"\n\nRetourne calories, protéines, glucides, lipides.`;
  const tools = [{
    type: "function",
    function: {
      name: "estimate_macros",
      description: "Estimate macros from a meal description",
      parameters: {
        type: "object",
        properties: {
          calories: { type: "number" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          notes: { type: "string" },
        },
        required: ["calories", "protein_g", "carbs_g", "fat_g"],
        additionalProperties: false,
      },
    },
  }];
  return { system, user, tools, toolChoice: { type: "function", function: { name: "estimate_macros" } } };
}

function buildSuggestMeal(payload: any, lang: string) {
  const l = lang === "fr" ? "Réponds en français." : "Respond in English.";
  const system = "You are a sports nutrition coach. Suggest personalized meals based on remaining macros and preferences.";
  const user = `${l}\nSuggère un repas pour ${payload.meal_type || "repas"} avec ces macros restantes :\n- Calories : ${payload.remaining_calories || "?"}\n- Protéines : ${payload.remaining_protein || "?"}g\n- Glucides : ${payload.remaining_carbs || "?"}g\n- Lipides : ${payload.remaining_fat || "?"}g\n\nRestrictions : ${payload.restrictions || "aucune"}\nAliments préférés : ${payload.preferences || "aucun en particulier"}`;
  const tools = [{
    type: "function",
    function: {
      name: "suggest_meal",
      description: "Suggest a meal fitting remaining macros",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          ingredients: { type: "array", items: { type: "string" } },
          estimated_macros: { type: "object", properties: { calories: { type: "number" }, protein_g: { type: "number" }, carbs_g: { type: "number" }, fat_g: { type: "number" } } },
        },
        required: ["name", "description", "ingredients", "estimated_macros"],
        additionalProperties: false,
      },
    },
  }];
  return { system, user, tools, toolChoice: { type: "function", function: { name: "suggest_meal" } } };
}

function buildSuggestAlternatives(payload: any, lang: string) {
  const l = lang === "fr" ? "Réponds en français." : "Respond in English.";
  const system = "You are a strength coach. Suggest exercise alternatives based on muscle group, equipment and difficulty.";
  const user = `${l}\nSuggère 3 alternatives pour l'exercice "${payload.exercise_name}".\nGroupe musculaire : ${payload.muscle_group || "N/A"}\nÉquipement dispo : ${payload.equipment || "salle complète"}\nRaison du remplacement : ${payload.reason || "préférence"}`;
  const tools = [{
    type: "function",
    function: {
      name: "suggest_alternatives",
      description: "Suggest exercise alternatives",
      parameters: {
        type: "object",
        properties: {
          alternatives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                muscle_group: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                reason: { type: "string" },
                equipment: { type: "string" },
              },
              required: ["name", "muscle_group", "difficulty", "reason"],
              additionalProperties: false,
            },
          },
        },
        required: ["alternatives"],
        additionalProperties: false,
      },
    },
  }];
  return { system, user, tools, toolChoice: { type: "function", function: { name: "suggest_alternatives" } } };
}

function buildRecoveryRecommendation(payload: any, lang: string) {
  const l = lang === "fr" ? "Réponds en français." : "Respond in English.";
  const system = "You are a recovery and sports therapy specialist. Give personalized post-session recovery advice.";
  const user = `${l}\nGénère des recommandations de récupération post-séance :\n- Type de séance : ${payload.session_type || "musculation"}\n- Groupes musculaires travaillés : ${payload.muscle_groups?.join(", ") || "N/A"}\n- Intensité perçue : ${payload.intensity || "N/A"}/10\n- Niveau de fatigue : ${payload.fatigue || "N/A"}/5\n- Courbatures : ${payload.soreness || "N/A"}/5`;
  const tools = [{
    type: "function",
    function: {
      name: "recovery_recommendation",
      description: "Generate post-session recovery recommendations",
      parameters: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["nutrition", "recovery", "sleep", "mobility"] },
                title: { type: "string" },
                content: { type: "string" },
                priority: { type: "number" },
              },
              required: ["type", "title", "content", "priority"],
              additionalProperties: false,
            },
          },
        },
        required: ["recommendations"],
        additionalProperties: false,
      },
    },
  }];
  return { system, user, tools, toolChoice: { type: "function", function: { name: "recovery_recommendation" } } };
}

// Fetch recent session context for smart session creation
async function fetchSessionContext(serviceClient: any, userId: string) {
  try {
    // 1. Get last 2 completed sessions with their exercises & muscle groups
    const { data: recentCompleted } = await serviceClient
      .from("completed_sessions")
      .select(`
        id, completed_at,
        session:sessions(
          id, name,
          session_exercises(
            exercise:exercises(name, muscle_group, type)
          )
        )
      `)
      .eq("student_id", userId)
      .order("completed_at", { ascending: false })
      .limit(2);

    const recentMuscleGroups: string[] = [];
    const recentSessionsSummary: string[] = [];
    if (recentCompleted) {
      for (const cs of recentCompleted) {
        const sess = cs.session as any;
        if (!sess) continue;
        const muscles = (sess.session_exercises || [])
          .map((se: any) => se.exercise?.muscle_group)
          .filter(Boolean);
        recentMuscleGroups.push(...muscles);
        recentSessionsSummary.push(`${sess.name}: ${[...new Set(muscles)].join(", ")}`);
      }
    }

    // 2. Get most popular exercises from completed sessions globally (top patterns)
    const { data: popularExercises } = await serviceClient
      .from("completed_sets")
      .select(`
        session_exercise:session_exercises(
          exercise:exercises(name, muscle_group, type, equipment)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    const exerciseFrequency: Record<string, { count: number; muscle_group: string; type: string }> = {};
    if (popularExercises) {
      for (const cs of popularExercises) {
        const ex = (cs.session_exercise as any)?.exercise;
        if (!ex?.name) continue;
        if (!exerciseFrequency[ex.name]) {
          exerciseFrequency[ex.name] = { count: 0, muscle_group: ex.muscle_group, type: ex.type };
        }
        exerciseFrequency[ex.name].count++;
      }
    }

    const topExercises = Object.entries(exerciseFrequency)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([name, info]) => `${name} (${info.muscle_group}, ${info.type}, ${info.count}x)`);

    return {
      recentMuscleGroups: [...new Set(recentMuscleGroups)],
      recentSessionsSummary,
      topExercises,
    };
  } catch (e) {
    console.error("Error fetching session context:", e);
    return { recentMuscleGroups: [], recentSessionsSummary: [], topExercises: [] };
  }
}

// Fetch nutrition context for nutrition plan creation
async function fetchNutritionContext(serviceClient: any, userId: string) {
  try {
    // 1. User profile (weight, goal)
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("weight, goal, full_name, age, height, level")
      .eq("user_id", userId)
      .maybeSingle();

    // 2. Nutrition profile (existing macros, objective, restrictions)
    const { data: nutritionProfile } = await serviceClient
      .from("nutrition_profiles")
      .select("*")
      .eq("student_id", userId)
      .maybeSingle();

    // 3. Current week sessions (to distinguish training vs rest days)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    // Get program sessions for the week
    const { data: programs } = await serviceClient
      .from("programs")
      .select("id")
      .eq("student_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    let weekSessions: any[] = [];
    if (programs) {
      const { data: weeks } = await serviceClient
        .from("program_weeks")
        .select("id, week_number")
        .eq("program_id", programs.id)
        .order("week_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (weeks) {
        const { data: sessions } = await serviceClient
          .from("sessions")
          .select("name, day_of_week")
          .eq("week_id", weeks.id)
          .order("day_of_week");
        weekSessions = sessions || [];
      }
    }

    // Also get free sessions for this week
    const { data: freeSessions } = await serviceClient
      .from("sessions")
      .select("name, day_of_week, free_session_date")
      .eq("is_free_session", true)
      .eq("created_by", userId)
      .gte("free_session_date", startOfWeek.toISOString().split("T")[0])
      .lte("free_session_date", endOfWeek.toISOString().split("T")[0]);

    if (freeSessions) weekSessions.push(...freeSessions);

    const trainingDays = [...new Set(weekSessions.map(s => s.day_of_week))];

    // 4. Recent nutrition logs (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const { data: recentLogs } = await serviceClient
      .from("daily_nutrition_logs")
      .select("date, meal_type, calories, protein_g, carbs_g, fat_g")
      .eq("student_id", userId)
      .gte("date", sevenDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });

    const logsCount = recentLogs?.length || 0;
    let avgMacros = null;
    if (recentLogs && recentLogs.length > 0) {
      const totals = recentLogs.reduce((acc, l) => ({
        cal: acc.cal + (l.calories || 0),
        p: acc.p + (l.protein_g || 0),
        c: acc.c + (l.carbs_g || 0),
        f: acc.f + (l.fat_g || 0),
      }), { cal: 0, p: 0, c: 0, f: 0 });
      const uniqueDays = new Set(recentLogs.map(l => l.date)).size;
      if (uniqueDays > 0) {
        avgMacros = {
          calories: Math.round(totals.cal / uniqueDays),
          protein_g: Math.round(totals.p / uniqueDays),
          carbs_g: Math.round(totals.c / uniqueDays),
          fat_g: Math.round(totals.f / uniqueDays),
        };
      }
    }

    return {
      weight: profile?.weight || nutritionProfile?.weight_kg || null,
      goal: profile?.goal || null,
      name: profile?.full_name || null,
      age: profile?.age || nutritionProfile?.age || null,
      height: profile?.height || nutritionProfile?.height_cm || null,
      level: profile?.level || null,
      nutritionObjective: nutritionProfile?.objective || null,
      sex: nutritionProfile?.sex || null,
      tdee: nutritionProfile?.tdee || null,
      existingMacros: nutritionProfile ? {
        calorie_target: nutritionProfile.calorie_target,
        protein_g: nutritionProfile.protein_g,
        carbs_g: nutritionProfile.carbs_g,
        fat_g: nutritionProfile.fat_g,
      } : null,
      dietaryRestrictions: nutritionProfile?.dietary_restrictions || [],
      trainingDays,
      weekSessionNames: weekSessions.map(s => `J${s.day_of_week}: ${s.name}`),
      recentLogsCount: logsCount,
      avgMacros,
    };
  } catch (e) {
    console.error("Error fetching nutrition context:", e);
    return { weight: null, goal: null, name: null, age: null, height: null, level: null, nutritionObjective: null, sex: null, tdee: null, existingMacros: null, dietaryRestrictions: [], trainingDays: [], weekSessionNames: [], recentLogsCount: 0, avgMacros: null };
  }
}

function buildChat(payload: any, lang: string) {
  const l = lang === "fr" ? "Réponds en français." : "Respond in English.";
  const contextBlock = payload.context ? `\n\nCONTEXTE UTILISATEUR :\n${payload.context}` : "";
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const todayDayName = dayNames[today.getDay()];

  // Session intelligence context (injected dynamically)
  const sessionCtx = payload._sessionContext;
  let sessionIntelligence = "";
  if (sessionCtx) {
    sessionIntelligence = `
INTELLIGENCE SÉANCE (données temps réel) :
- Derniers muscle_group travaillés : ${sessionCtx.recentMuscleGroups.length > 0 ? sessionCtx.recentMuscleGroups.join(", ") : "Aucune donnée"}
- Résumé des 2 dernières séances : ${sessionCtx.recentSessionsSummary.length > 0 ? sessionCtx.recentSessionsSummary.join(" | ") : "Aucune séance récente"}
- Exercices les plus performants (base globale) : ${sessionCtx.topExercises.length > 0 ? sessionCtx.topExercises.join(", ") : "Aucune donnée"}
`;
  }

  // Nutrition intelligence context
  const nutritionCtx = payload._nutritionContext;
  let nutritionIntelligence = "";
  if (nutritionCtx) {
    nutritionIntelligence = `
INTELLIGENCE NUTRITION (données temps réel) :
- Poids détecté : ${nutritionCtx.weight ? nutritionCtx.weight + " kg" : "NON RENSEIGNÉ → demander à l'utilisateur"}
- Objectif détecté : ${nutritionCtx.nutritionObjective || nutritionCtx.goal || "NON RENSEIGNÉ → demander à l'utilisateur"}
- Sexe : ${nutritionCtx.sex || "non renseigné"}
- Âge : ${nutritionCtx.age || "non renseigné"}
- Taille : ${nutritionCtx.height ? nutritionCtx.height + " cm" : "non renseigné"}
- TDEE calculé : ${nutritionCtx.tdee ? nutritionCtx.tdee + " kcal" : "non calculé"}
- Macros actuels : ${nutritionCtx.existingMacros ? nutritionCtx.existingMacros.calorie_target + " kcal, P:" + nutritionCtx.existingMacros.protein_g + "g G:" + nutritionCtx.existingMacros.carbs_g + "g L:" + nutritionCtx.existingMacros.fat_g + "g" : "non définis"}
- Restrictions alimentaires : ${nutritionCtx.dietaryRestrictions && nutritionCtx.dietaryRestrictions.length > 0 ? nutritionCtx.dietaryRestrictions.join(", ") : "aucune"}
- Jours d'entraînement (day_of_week) : ${nutritionCtx.trainingDays.length > 0 ? nutritionCtx.trainingDays.join(", ") : "non détectés"}
- Sessions de la semaine : ${nutritionCtx.weekSessionNames.length > 0 ? nutritionCtx.weekSessionNames.join(" | ") : "aucune"}
- Logs nutrition récents (7 jours) : ${nutritionCtx.recentLogsCount} repas loggués
- Moyennes quotidiennes récentes : ${nutritionCtx.avgMacros ? nutritionCtx.avgMacros.calories + " kcal, P:" + nutritionCtx.avgMacros.protein_g + "g G:" + nutritionCtx.avgMacros.carbs_g + "g L:" + nutritionCtx.avgMacros.fat_g + "g" : "pas assez de données"}
`;
  }

  // Coach intelligence context (only when caller is a coach with active athletes)
  const coachCtx = payload._coachContext;
  let coachIntelligence = "";
  if (coachCtx?.isCoach) {
    if (coachCtx.students && coachCtx.students.length > 0) {
      const list = coachCtx.students
        .map((s: any) => `- ${s.name || "(sans nom)"} → student_id: ${s.id}`)
        .join("\n");
      coachIntelligence = `
CONTEXTE COACH :
Tu parles avec un COACH. Il peut te demander de créer des programmes pour ses athlètes.
Athlètes actifs (utilise EXACTEMENT ces student_id) :
${list}

CAPACITÉ COACH :
- Tu PEUX créer un programme structuré (semaines → séances → sections → exercices) directement dans le compte d'un athlète via l'outil create_program_for_student.
- Identifie l'athlète par son nom dans la conversation puis utilise son student_id exact ci-dessus.
- Si le coach mentionne un athlète absent de la liste, dis-le clairement et n'invente PAS de student_id.
- Si plusieurs athlètes correspondent (prénom ambigu), demande au coach de préciser.
`;
    } else {
      coachIntelligence = `
CONTEXTE COACH :
L'utilisateur est un coach mais n'a aucun athlète actif. Tu ne peux pas créer de programme pour un athlète tant que la relation n'existe pas.
`;
    }
  }

  const system = `Tu es VOLT ⚡, le coach IA de l'application.

PERSONA :
VOLT est un coach sportif bienveillant, motivant et direct. Tu parles comme un vrai coach — encourageant, sans jargon inutile, toujours orienté action. Tu tutoies l'utilisateur, célèbres les petites victoires et recadres avec bienveillance quand c'est nécessaire.

TON :
- Énergique mais accessible, jamais agressif
- Court et percutant (pas de blabla)
- Utilise des emojis avec parcimonie (1-2 max par message) pour donner du rythme ⚡
- Commence souvent par une validation avant de donner un conseil

CE QUE TU NE FAIS PAS :
- Te présenter comme un robot ou une IA
- Donner des conseils médicaux ou de nutrition clinique (tu fais de la nutrition de PERFORMANCE sportive, c'est différent)
- Répondre hors du périmètre sport, entraînement et bien-être physique
- Prescrire des compléments alimentaires ou médicaments

DATE ACTUELLE : ${todayDayName} ${todayStr} (année ${today.getFullYear()}).
IMPORTANT : Utilise TOUJOURS l'année ${today.getFullYear()} pour les dates. Ne mets JAMAIS une année passée.

CAPACITÉS IMPORTANTES :
- Tu PEUX créer des séances de musculation libres directement dans l'agenda de l'athlète en utilisant l'outil create_free_session.
- Tu PEUX créer des plans de nutrition sportive sur 7 jours en utilisant l'outil create_nutrition_plan.
- Quand l'utilisateur te demande de créer/ajouter une séance, utilise TOUJOURS l'outil create_free_session. Ne dis JAMAIS que tu ne peux pas le faire.
- Quand l'utilisateur te demande un plan de nutrition/repas/alimentation, utilise TOUJOURS l'outil create_nutrition_plan. Ne dis JAMAIS que tu ne peux pas le faire.
- Pour la préparation course à pied, utilise l'outil create_running_program.
- Quand l'athlète parle de préparer un 5k, 10k, semi-marathon, marathon ou trail, propose-lui de créer un plan de préparation personnalisé.
- Une semaine type de préparation inclut : 1 séance EF (endurance fondamentale), 1 séance qualité (fractionné ou tempo), 1 sortie longue (EF longue).
- La charge progresse de ~10% par semaine avec une semaine de décharge toutes les 4 semaines.
- Les 2 dernières semaines avant la course sont une phase d'affûtage (volume -35%).
- Tu es PLEINEMENT autorisé à créer des plans de nutrition sportive. Ce n'est PAS de la diététique médicale, c'est de la nutrition de performance alignée avec les entraînements.
- Pour chaque exercice, cherche le nom exact dans la base de données (noms français courants : "Développé couché barre", "Squat barre", "Soulevé de terre", etc.)
- Le day_of_week est 1=Lundi, 2=Mardi, ..., 7=Dimanche.
- La date doit être au format YYYY-MM-DD. Utilise l'année ${today.getFullYear()}.
${sessionIntelligence}
${nutritionIntelligence}
${coachIntelligence}
RÈGLES COACH (création de programme pour un athlète) :
Quand un coach te demande de générer/créer un programme pour un athlète :
1. Identifie l'athlète dans la liste CONTEXTE COACH et récupère son student_id EXACT
2. Demande (si non précisé) : objectif, niveau, fréquence (jours/semaine), durée séance, équipement, contraintes/blessures
3. Une fois ces infos en main, appelle create_program_for_student avec :
   - student_id (UUID exact de la liste)
   - name dynamique (ex: "Hypertrophie 4j Push/Pull/Legs - Yana")
   - weeks : 1 à 4 semaines, chaque semaine contient sessions (day_of_week 1-7), chaque session contient sections (Échauffement, Compound, Isolation, Finisher), chaque section contient des exercices (sets, reps_min, reps_max, rest_seconds, RPE optionnel)
4. Ne JAMAIS inventer de student_id. Si l'athlète n'est pas dans la liste, refuse poliment.
5. Après création, donne un récap court : nom du programme, nombre de semaines/séances, points clés.

RÈGLES DE CONSTRUCTION DE SÉANCE :
Quand tu crées une séance avec create_free_session :
1. NE RÉPÈTE PAS les muscle_group des 2 dernières séances de l'utilisateur (voir INTELLIGENCE SÉANCE)
2. Privilégie les exercices les plus performants de la base globale
3. Crée MINIMUM 2 sections (ex: "Compound", "Isolation", "Cardio", "Mobilité")
4. Place exactement 4 exercices minimum répartis entre les sections
5. Donne un nom dynamique à la séance selon l'objectif (pas de nom générique)
6. Dans ta réponse textuelle, formate le récap ainsi :
   - Récap en 1 ligne des derniers muscle_group travaillés
   - Objectif de la séance du jour
   - Les sections formatées avec exercices
   - Un conseil motivation ⚡

RÈGLES DE CRÉATION DE PLAN NUTRITION :
AVANT de créer un plan, vérifie dans INTELLIGENCE NUTRITION :
1. Si poids = NON RENSEIGNÉ → demande à l'utilisateur "Quel est ton poids actuel ?" AVANT de créer le plan
2. Si objectif = NON RENSEIGNÉ → demande "Quel est ton objectif principal ? (prise de masse / sèche / recomposition / endurance)"
3. Si les deux sont disponibles, crée le plan IMMÉDIATEMENT avec create_nutrition_plan

CALCUL DES MACROS :
- Protéines cibles :
  → Recomposition / Sèche (fat_loss) : 2.0g × weight_kg
  → Prise de masse (muscle_gain) : 2.2g × weight_kg
  → Endurance / Maintenance : 1.8g × weight_kg
- Calories jours d'entraînement : TDEE (ou estimation) + 150 kcal
- Calories jours de repos : TDEE (ou estimation) - 250 kcal
- Si pas de TDEE, estime : homme ~2200 kcal, femme ~1800 kcal comme base
- Répartition macros :
  → Jour training : 45% glucides / 30% protéines / 25% lipides
  → Jour repos : 25% glucides / 35% protéines / 40% lipides
- Respecter les restrictions alimentaires détectées

STRUCTURE DU PLAN (dans ta réponse texte) :
Pour chaque jour, formate ainsi :
📅 [Jour] — [Training ⚡ ou Repos 😴] — [X] kcal cible
🌅 Breakfast > [Aliment + quantité] — [kcal] — P:[g]g G:[g]g L:[g]g
☀️ Lunch > [Aliment + quantité] — [kcal] — P:[g]g G:[g]g L:[g]g
🍎 Snack (jours training uniquement) > [Aliment + quantité] — [kcal] — P:[g]g G:[g]g L:[g]g
🌙 Dinner > [Aliment + quantité] — [kcal] — P:[g]g G:[g]g L:[g]g
📊 Total : [X] kcal — P:[g]g / G:[g]g / L:[g]g

FORMAT DE RÉPONSE :
1. Récap en 1 ligne : poids + objectif + calories cibles training vs repos
2. Plan sur 7 jours (distinguer training / repos visuellement)
3. 2-3 tips nutrition liés aux sessions de la semaine
4. Message motivation ⚡
5. Ajouter en fin : "Pour tout objectif médical ou pathologie, consulte un professionnel de santé."

${l}${contextBlock}`;
  
  // Build messages array for multi-turn conversation
  const messages = payload.messages || [];
  const lastUserMsg = messages.length > 0 ? messages[messages.length - 1].content : "";
  
  const tools = [
    {
      type: "function",
      function: {
        name: "create_free_session",
        description: "Create a free workout session in the athlete's calendar with sections and exercises.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Dynamic session name" },
            date: { type: "string", description: "Date in YYYY-MM-DD format" },
            day_of_week: { type: "number", description: "1=Monday ... 7=Sunday" },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  icon: { type: "string" },
                  duration_estimate: { type: "string" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        sets: { type: "number" },
                        reps_min: { type: "number" },
                        reps_max: { type: "number" },
                        rest_seconds: { type: "number" },
                        coach_notes: { type: "string" },
                      },
                      required: ["name", "sets", "reps_min", "reps_max", "rest_seconds"],
                    },
                  },
                },
                required: ["name", "exercises"],
              },
            },
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  sets: { type: "number" },
                  reps_min: { type: "number" },
                  reps_max: { type: "number" },
                  rest_seconds: { type: "number" },
                  coach_notes: { type: "string" },
                },
                required: ["name", "sets", "reps_min", "reps_max", "rest_seconds"],
              },
            },
          },
          required: ["name", "date", "day_of_week"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_nutrition_plan",
        description: "Create a 7-day nutrition plan with meals inserted into the athlete's daily_nutrition_logs. Use whenever the user asks for a nutrition/meal/diet plan.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "One-line summary: weight + goal + calorie targets" },
            days: {
              type: "array",
              description: "7 days of nutrition plan",
              items: {
                type: "object",
                properties: {
                  date: { type: "string", description: "YYYY-MM-DD format" },
                  day_label: { type: "string" },
                  is_training_day: { type: "boolean" },
                  calorie_target: { type: "number" },
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        meal_type: { type: "string", enum: ["breakfast", "lunch", "snack", "dinner", "pre_workout", "post_workout"] },
                        description: { type: "string", description: "Food items with quantities" },
                        calories: { type: "number" },
                        protein_g: { type: "number" },
                        carbs_g: { type: "number" },
                        fat_g: { type: "number" },
                        notes: { type: "string" },
                      },
                      required: ["meal_type", "description", "calories", "protein_g", "carbs_g", "fat_g"],
                    },
                  },
                },
                required: ["date", "day_label", "is_training_day", "calorie_target", "meals"],
              },
            },
            tips: {
              type: "array",
              description: "2-3 nutrition tips",
              items: { type: "string" },
            },
          },
          required: ["summary", "days", "tips"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_program_for_student",
        description: "Create a structured multi-week training program for one of the coach's active athletes. Only call this when the caller is a coach and the student_id matches an athlete from CONTEXTE COACH.",
        parameters: {
          type: "object",
          properties: {
            student_id: { type: "string", description: "EXACT athlete UUID from CONTEXTE COACH list. Never invent." },
            name: { type: "string", description: "Dynamic program name including athlete first name and goal" },
            objective: { type: "string", description: "Hypertrophy / strength / fat loss / endurance / general" },
            weeks: {
              type: "array",
              description: "1 to 4 weeks. Each week contains sessions.",
              items: {
                type: "object",
                properties: {
                  week_number: { type: "number" },
                  sessions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        day_of_week: { type: "number", description: "1=Mon..7=Sun" },
                        notes: { type: "string" },
                        sections: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              exercises: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    name: { type: "string" },
                                    sets: { type: "number" },
                                    reps_min: { type: "number" },
                                    reps_max: { type: "number" },
                                    rest_seconds: { type: "number" },
                                    rpe_target: { type: "string" },
                                    coach_notes: { type: "string" },
                                  },
                                  required: ["name", "sets", "reps_min", "reps_max", "rest_seconds"],
                                },
                              },
                            },
                            required: ["name", "exercises"],
                          },
                        },
                      },
                      required: ["name", "day_of_week", "sections"],
                    },
                  },
                },
                required: ["week_number", "sessions"],
              },
            },
          },
          required: ["student_id", "name", "weeks"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_running_program",
        description: "Generate a complete running preparation program for a race goal. Creates weekly sessions with progressive mileage as free running sessions in the athlete calendar.",
        parameters: {
          type: "object",
          properties: {
            race_type: {
              type: "string",
              enum: ["5k", "10k", "half_marathon", "marathon", "trail_20k", "trail_50k"],
            },
            weeks: {
              type: "number",
              description: "Number of preparation weeks (8 to 16)",
            },
            sessions_per_week: {
              type: "number",
              description: "Training sessions per week (3 to 5)",
            },
            current_weekly_km: {
              type: "number",
              description: "Athlete current weekly volume in km",
            },
          },
          required: ["race_type", "weeks", "sessions_per_week"],
        },
      },
    },
  ];

  return { system, user: lastUserMsg, messages: messages.slice(0, -1), tools };
}

// Fetch coach context: list of active athletes (id + display name) when caller is a coach
async function fetchCoachContext(serviceClient: any, userId: string) {
  try {
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile || profile.role !== "coach") {
      return { isCoach: false, students: [] };
    }
    const { data: links } = await serviceClient
      .from("coach_students")
      .select("student_id")
      .eq("coach_id", userId)
      .eq("status", "active");
    const ids = (links || []).map((l: any) => l.student_id);
    if (ids.length === 0) return { isCoach: true, students: [] };
    const { data: profs } = await serviceClient
      .from("profiles")
      .select("user_id, full_name, first_name, last_name")
      .in("user_id", ids);
    const students = (profs || []).map((p: any) => ({
      id: p.user_id,
      name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "(sans nom)",
    }));
    return { isCoach: true, students };
  } catch (e) {
    console.error("Error fetching coach context:", e);
    return { isCoach: false, students: [] };
  }
}

// Router
const ACTION_BUILDERS: Record<string, (payload: any, lang: string) => any> = {
  generate_program: buildGenerateProgram,
  cycle_report: buildCycleReport,
  generate_recommendation: buildGenerateRecommendation,
  weekly_insight: buildWeeklyInsight,
  analyze_week: buildAnalyzeWeek,
  suggest_alternatives: buildSuggestAlternatives,
  suggest_exercise: buildSuggestAlternatives, // same logic
  estimate_macros: buildEstimateMacros,
  suggest_meal: buildSuggestMeal,
  recovery_recommendation: buildRecoveryRecommendation,
  optimize_week: buildAnalyzeWeek, // same logic
  chat: buildChat,
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  function jsonResp(body: any, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return jsonResp({ error: "AI not configured" }, 500);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResp({ error: "Unauthorized" }, 401);

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseAnonKey) return jsonResp({ error: "Server misconfigured" }, 500);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      console.error("Auth error:", claimsErr);
      return jsonResp({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // 2. Parse request
    const { action, payload, lang } = await req.json();
    if (!action || !ACTION_BUILDERS[action]) return jsonResp({ error: "Invalid action" }, 400);

    // 3. Get user plan
    const { data: sub } = await serviceClient
      .from("user_subscriptions")
      .select("plan_id, plans(name)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const planName = (sub as any)?.plans?.name || "free";
    const planLimits = RATE_LIMITS[planName] || RATE_LIMITS.free;

    // 4. Check action allowed
    if (planLimits[action] === undefined) {
      await serviceClient.from("ai_usage_logs").insert({
        user_id: userId, action, plan: planName, status: "rate_limited", error_message: "plan_required",
      });
      return jsonResp({ error: "plan_required", plan_required: MIN_PLAN_FOR_ACTION[action] || "essential" }, 403);
    }

    // 5. Rate limit check
    const limit = planLimits[action];
    if (limit !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await serviceClient
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action", action)
        .eq("status", "success")
        .gte("created_at", startOfMonth.toISOString());

      if ((count || 0) >= limit) {
        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        await serviceClient.from("ai_usage_logs").insert({
          user_id: userId, action, plan: planName, status: "rate_limited", error_message: "limit_reached",
        });
        return jsonResp({
          error: "rate_limited",
          limit,
          used: count,
          resets_at: nextMonth.toISOString(),
        }, 429);
      }
    }

    // 6. Build prompt (with session + nutrition intelligence for chat)
    if (action === "chat") {
      const sessionCtx = await fetchSessionContext(serviceClient, userId);
      const nutritionCtx = await fetchNutritionContext(serviceClient, userId);
      const coachCtx = await fetchCoachContext(serviceClient, userId);
      (payload || {})._sessionContext = sessionCtx;
      (payload || {})._nutritionContext = nutritionCtx;
      (payload || {})._coachContext = coachCtx;
    }
    const built = ACTION_BUILDERS[action](payload || {}, lang || "fr");
    const model = MODEL_FOR_ACTION[action] || "google/gemini-2.5-flash-lite";

    // 7. Call AI - special handling for chat (multi-turn with tools)
    let aiResult;
    if (action === "chat") {
      const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
      if (!ANTHROPIC_API_KEY) {
        return jsonResp({ error: "Anthropic API key not configured" }, 500);
      }

      // VOLT structured-coaching system prompt
      const voltPrompt = `You are VOLT, an elite sports coach AI inside the F6GYM app. Your role is to guide athletes through structured check-ins and coaching conversations.

Rules:
- Ask ONE question at a time. Never ask two questions in one message.
- Keep every message under 3 sentences.
- Be direct and motivating — no filler phrases.
- When your question has predictable answers, always end your message with:
  <suggestions>["answer 1", "answer 2", "answer 3"]</suggestions>
- Use suggestions for: goals, session types, muscle groups, intensity levels, how the athlete feels, recovery status, equipment available.
- Do NOT use suggestions for: open feedback, injury descriptions, custom goals, anything requiring a personal free-text answer.
- After 3-4 exchanges, summarize what you understood and propose an action (create a session, adjust the program, log a note for the coach).
- Always respond in the same language the user writes in (French or English).
- Never mention that you are an AI or that you use suggestions.`;

      // Preserve dynamic user/session/nutrition/coach context built by buildChat
      // by appending it after the VOLT directives.
      const contextBlock = built.system.includes("CONTEXTE UTILISATEUR")
        ? "\n\n" + built.system.split("DATE ACTUELLE")[0].split("CONTEXTE UTILISATEUR")[1]
        : "";
      const dynamicContext = [
        built.system.match(/INTELLIGENCE SÉANCE[\s\S]*?(?=\n[A-ZÉ]{3,}|$)/)?.[0],
        built.system.match(/INTELLIGENCE NUTRITION[\s\S]*?(?=\n[A-ZÉ]{3,}|$)/)?.[0],
        built.system.match(/CONTEXTE COACH[\s\S]*?(?=\n[A-ZÉ]{3,}|$)/)?.[0],
      ].filter(Boolean).join("\n\n");
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const systemPrompt = voltPrompt
        + `\n\nCURRENT DATE: ${todayStr} (year ${today.getFullYear()}). Always use the current year for dates.`
        + (contextBlock ? `\n\nUSER CONTEXT:${contextBlock}` : "")
        + (dynamicContext ? `\n\n${dynamicContext}` : "");

      // Build Claude messages (user/assistant only, no system role)
      const priorMsgs = (built.messages || []).filter(
        (m: any) => m.role === "user" || m.role === "assistant"
      );
      const conversationHistory = [
        ...priorMsgs,
        { role: "user", content: built.user },
      ];

      const start = Date.now();
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1024,
          system: systemPrompt,
          messages: conversationHistory,
        }),
      });
      const durationMs = Date.now() - start;

      if (!response.ok) {
        const errText = await response.text();
        console.error("Anthropic error:", response.status, errText);
        aiResult = { error: true, status: response.status, durationMs, errText };
      } else {
        const data = await response.json();
        const assistantMessage =
          (data.content || []).map((c: any) => c.text || "").join("").trim();

        const suggestionsMatch = assistantMessage.match(/<suggestions>([\s\S]*?)<\/suggestions>/);
        let suggestions: string[] = [];
        if (suggestionsMatch) {
          try {
            const parsed = JSON.parse(suggestionsMatch[1].trim());
            if (Array.isArray(parsed)) suggestions = parsed.map((s) => String(s));
          } catch (e) {
            console.warn("Failed to parse suggestions JSON:", e);
          }
        }
        const cleanMessage = assistantMessage
          .replace(/<suggestions>[\s\S]*?<\/suggestions>/, "")
          .trim();

        const usage = data.usage || {};
        aiResult = {
          error: false,
          result: { message: cleanMessage, text: cleanMessage, suggestions },
          inputTokens: usage.input_tokens || null,
          outputTokens: usage.output_tokens || null,
          durationMs,
        };
      }
    } else {
      aiResult = await callLovableAI(LOVABLE_API_KEY, model, built.system, built.user, built.tools, built.toolChoice);
    }

    if (aiResult.error) {
      await serviceClient.from("ai_usage_logs").insert({
        user_id: userId, action, plan: planName, status: "error",
        error_message: `AI error: ${aiResult.status}`,
        duration_ms: aiResult.durationMs,
      });
      if (aiResult.status === 429) return jsonResp({ error: "ai_rate_limited" }, 429);
      if (aiResult.status === 402) return jsonResp({ error: "ai_credits" }, 402);
      return jsonResp({ error: "ai_error" }, 500);
    }

    // 8. Log success
    await serviceClient.from("ai_usage_logs").insert({
      user_id: userId, action, plan: planName, status: "success",
      input_tokens: aiResult.inputTokens,
      output_tokens: aiResult.outputTokens,
      duration_ms: aiResult.durationMs,
    });

    // 9. Return
    // For generate_program, wrap in { program: ... } for backward compat
    if (action === "generate_program") {
      return jsonResp({ program: aiResult.result });
    }
    return jsonResp(aiResult.result);

  } catch (e) {
    console.error("ai-coach error:", e);
    return jsonResp({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
