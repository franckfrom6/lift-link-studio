import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = [
  "https://lift-link-studio.lovable.app",
  "https://id-preview--0363201d-a29c-474b-ab98-106ca7fb6ee7.lovable.app",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { prompt, structured } = await req.json();

    // Build the system prompt
    const systemPrompt = `Tu es un coach sportif expert en programmation d'entraînement. Tu génères des programmes d'entraînement structurés et détaillés.

Quand on te donne une description de programme, tu dois retourner un programme structuré en utilisant le tool "generate_program".

Règles importantes :
- Chaque séance doit être organisée en sections (warm-up, blocs principaux, cool-down)
- Chaque exercice doit avoir des sets, reps, tempo, repos, RPE, notes techniques détaillées
- Les vidéos YouTube doivent être de vraies URLs de chaînes fitness connues (Jeff Nippard, Bret Contreras, Squat University, etc.)
- Si tu ne connais pas l'URL exacte, utilise video_search_query avec les termes de recherche
- Les repos sont en secondes
- Les notes doivent être des conseils techniques précis et utiles
- Génère des programmes en français`;

    // Build user message
    let userMessage: string;
    if (structured) {
      userMessage = `Génère un programme d'entraînement avec les paramètres suivants :
- Objectif : ${structured.objective || "Non spécifié"}
- Niveau : ${structured.level || "Intermédiaire"}
- Fréquence : ${structured.frequency || "3x/semaine"}
- Durée par séance : ${structured.duration || "1h"}
- Équipement disponible : ${structured.equipment || "Salle complète"}
- Contraintes / notes : ${structured.notes || "Aucune"}
${prompt ? `\nInstructions supplémentaires : ${prompt}` : ""}`;
    } else {
      userMessage = prompt;
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_program",
            description: "Generate a structured training program",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Program name" },
                objective: { type: "string", description: "Program objective" },
                duration_weeks: { type: "number", description: "Number of weeks" },
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
                            day_of_week: { type: "number", description: "1=Monday, 7=Sunday" },
                            sections: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string" },
                                  icon: { type: "string", description: "Emoji icon" },
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
                                        tempo: { type: "string", description: "e.g. 2-0-1-2" },
                                        rest_seconds: { type: "number" },
                                        rpe_target: { type: "string", description: "e.g. 8-9" },
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
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_program" } },
    };

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants. Ajoutez des crédits dans les paramètres." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "generate_program") {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "L'IA n'a pas pu générer le programme" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const program = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ program }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-program error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
