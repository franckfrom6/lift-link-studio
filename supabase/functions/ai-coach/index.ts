import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  },
};

const MIN_PLAN_FOR_ACTION: Record<string, string> = {
  generate_program: "essential",
  suggest_alternatives: "essential",
  suggest_exercise: "essential",
  estimate_macros: "essential",
  recovery_recommendation: "essential",
  generate_recommendation: "essential",
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

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: claimsData, error: claimsErr } = await supabase.auth.getUser();
    if (claimsErr || !claimsData?.user) return jsonResp({ error: "Unauthorized" }, 401);
    const userId = claimsData.user.id;

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

    // 6. Build prompt
    const { system, user, tools, toolChoice } = ACTION_BUILDERS[action](payload || {}, lang || "fr");
    const model = MODEL_FOR_ACTION[action] || "google/gemini-2.5-flash-lite";

    // 7. Call AI
    const aiResult = await callLovableAI(LOVABLE_API_KEY, model, system, user, tools, toolChoice);

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
