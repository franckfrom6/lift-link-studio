import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not configured");
    }

    const { exerciseName } = await req.json();
    if (!exerciseName || typeof exerciseName !== "string") {
      return new Response(
        JSON.stringify({ error: "exerciseName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const query = `${exerciseName} exercise tutorial`;
    const params = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "1",
      videoEmbeddable: "true",
      videoDuration: "short",
    });

    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );
    const ytData = await ytRes.json();

    if (!ytRes.ok) {
      console.error("YouTube API error:", JSON.stringify(ytData));
      throw new Error(`YouTube API error [${ytRes.status}]: ${JSON.stringify(ytData)}`);
    }

    const videoId = ytData.items?.[0]?.id?.videoId || null;
    const title = ytData.items?.[0]?.snippet?.title || null;
    const thumbnail = ytData.items?.[0]?.snippet?.thumbnails?.high?.url || null;

    return new Response(
      JSON.stringify({ videoId, title, thumbnail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in youtube-search:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
