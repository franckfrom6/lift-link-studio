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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, category, student_name, trigger_type, trigger_config, lang } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langInstruction = lang === "fr" ? "Réponds en français." : "Respond in English.";
    const typeLabel = type === "nutrition" ? "nutritionnelle" : "de récupération";
    const studentContext = student_name ? `Élève cible : ${student_name}.` : "Recommandation globale pour tous les élèves.";
    const triggerContext = trigger_type && trigger_type !== "always"
      ? `Contexte d'affichage : ${trigger_type}. Config : ${JSON.stringify(trigger_config || {})}.`
      : "";

    const prompt = `${langInstruction}
Génère une recommandation ${typeLabel} pour un coach sportif.
Catégorie : ${category}
${studentContext}
${triggerContext}

Génère un contenu concret et actionnable (2-4 paragraphes) qu'un coach donnerait à son client.
${type === "nutrition" ? "Inclus des exemples d'aliments/repas spécifiques." : "Génère un protocole étape par étape avec durées et techniques."}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a professional sports coach assistant creating actionable recommendations." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_recommendation",
              description: "Generate a coach recommendation with title and content",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short recommendation title" },
                  content: { type: "string", description: "Detailed recommendation content (2-4 paragraphs)" },
                },
                required: ["title", "content"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_recommendation" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    if (toolCall?.function?.arguments) {
      result = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      throw new Error("No structured output");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recommendation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
