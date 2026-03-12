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

  const email = "tim.athlete@demo.f6gym.com";
  const password = "Test1234!";

  // Check if already exists
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("full_name", "Tim Athlete")
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ message: "Already exists", user_id: existing.user_id }), {
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

  // Create profile
  await supabaseAdmin.from("profiles").upsert({
    user_id: userId,
    full_name: "Tim Athlete",
    role: "student",
    onboarding_completed: true,
    level: "intermediate",
    goal: "muscle_gain",
  });

  // Assign Advanced plan
  const { data: advPlan } = await supabaseAdmin
    .from("plans")
    .select("id")
    .eq("name", "advanced")
    .single();

  if (advPlan) {
    await supabaseAdmin.from("user_subscriptions").upsert({
      user_id: userId,
      plan_id: advPlan.id,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
    });
  }

  // Link to coach (Franck)
  const { data: coach } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("role", "coach")
    .eq("full_name", "Franck Berthelot")
    .maybeSingle();

  if (coach) {
    await supabaseAdmin.from("coach_students").insert({
      coach_id: coach.user_id,
      student_id: userId,
      status: "active",
    }).then(() => {});
  }

  return new Response(
    JSON.stringify({ message: "Tim created", email, password, user_id: userId }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
