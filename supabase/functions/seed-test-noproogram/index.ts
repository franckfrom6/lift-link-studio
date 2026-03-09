import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const email = "test-solo@f6gym.app";
  const password = "Test1234!";

  // Check if user already exists
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("full_name", "Sophie Test (Sans Programme)")
    .maybeSingle();

  if (existingProfile) {
    return new Response(JSON.stringify({ message: "User already exists", user_id: existingProfile.user_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = authData.user.id;

  // Create profile — student, onboarding done, no coach, no program
  await supabaseAdmin.from("profiles").upsert({
    user_id: userId,
    full_name: "Sophie Test (Sans Programme)",
    role: "student",
    onboarding_completed: true,
    level: "intermediate",
    goal: "muscle_gain",
    age: 28,
    weight: 62,
    height: 168,
  });

  return new Response(
    JSON.stringify({
      message: "Test user created (no program, no coach)",
      email,
      password,
      user_id: userId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
