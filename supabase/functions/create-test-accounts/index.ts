import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const origin = req.headers.get("origin") || "https://lift-link-studio.lovable.app";

    const accounts = [
      { email: "test-coach@f6gym.test", full_name: "Coach Test", role: "coach" },
      { email: "test-athlete@f6gym.test", full_name: "Athlete Test", role: "student" },
    ];

    const results: any[] = [];

    for (const acc of accounts) {
      // Try to find existing user
      const { data: list } = await admin.auth.admin.listUsers();
      let user = list.users.find((u) => u.email === acc.email);

      if (!user) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: acc.email,
          email_confirm: true,
        });
        if (createErr) throw createErr;
        user = created.user!;

        await admin.from("profiles").upsert({
          user_id: user.id,
          full_name: acc.full_name,
          role: acc.role,
          onboarding_completed: true,
        }, { onConflict: "user_id" });
      } else {
        await admin.from("profiles").upsert({
          user_id: user.id,
          full_name: acc.full_name,
          role: acc.role,
          onboarding_completed: true,
        }, { onConflict: "user_id" });
      }

      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: acc.email,
        options: { redirectTo: origin },
      });
      if (linkErr) throw linkErr;

      results.push({
        email: acc.email,
        role: acc.role,
        user_id: user.id,
        magic_link: linkData.properties?.action_link,
      });
    }

    return new Response(JSON.stringify({ accounts: results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});