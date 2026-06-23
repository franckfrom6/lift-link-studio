import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOG = "[admin-create-user]";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await authedClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      console.error(LOG, "invalid token", claimsErr);
      return json({ error: "Unauthorized" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);

    // Check caller is admin
    const { data: callerProfile, error: profileErr } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", callerId)
      .maybeSingle();
    if (profileErr) {
      console.error(LOG, "profile fetch error", profileErr);
      return json({ error: "Server error" }, 500);
    }
    if (!callerProfile?.is_admin) {
      return json({ error: "Forbidden" }, 403);
    }

    // Parse + validate body
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid JSON" }, 400);

    const email = String(body.email ?? "").trim().toLowerCase();
    const full_name = String(body.full_name ?? "").trim();
    const role = body.role;
    const coach_id = body.coach_id ? String(body.coach_id) : null;
    const plan_name = body.plan_name ? String(body.plan_name) : "free";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid email" }, 400);
    }
    if (!full_name) return json({ error: "Missing full_name" }, 400);
    if (role !== "coach" && role !== "student") {
      return json({ error: "Invalid role" }, 400);
    }
    if (coach_id && role !== "student") {
      return json({ error: "coach_id only valid for students" }, 400);
    }

    // Create auth user (email auto-confirmed so login works immediately)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (createErr || !created.user) {
      console.error(LOG, "createUser failed", createErr);
      return json({ error: createErr?.message ?? "Failed to create user" }, 400);
    }
    const newUserId = created.user.id;
    console.log(LOG, "user created", newUserId, email);

    // Upsert profile (trigger may have already created an empty one)
    const { error: upsertErr } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: newUserId,
          full_name,
          role,
          onboarding_completed: true,
        },
        { onConflict: "user_id" }
      );
    if (upsertErr) {
      console.error(LOG, "profile upsert failed", upsertErr);
      return json({ error: "Profile upsert failed: " + upsertErr.message }, 500);
    }

    // Coach link
    if (role === "student" && coach_id) {
      const { error: linkErr } = await admin
        .from("coach_students")
        .insert({ coach_id, student_id: newUserId, status: "active" });
      if (linkErr) {
        console.error(LOG, "coach link failed", linkErr);
        // non-fatal
      }
    }

    // Plan override (free is auto-assigned by trigger)
    if (plan_name && plan_name !== "free") {
      const { data: plan } = await admin
        .from("plans")
        .select("id")
        .eq("name", plan_name)
        .maybeSingle();
      if (plan?.id) {
        const { data: existingSub } = await admin
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", newUserId)
          .maybeSingle();
        if (existingSub) {
          await admin
            .from("user_subscriptions")
            .update({ plan_id: plan.id })
            .eq("id", existingSub.id);
        } else {
          await admin
            .from("user_subscriptions")
            .insert({ user_id: newUserId, plan_id: plan.id, status: "active" });
        }
      }
    }

    // Generate magic link (email sent via auth-email-hook)
    const origin = req.headers.get("origin") || Deno.env.get("APP_URL") || "";
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: origin ? { redirectTo: origin } : undefined,
    });
    if (linkErr) {
      console.error(LOG, "generateLink failed", linkErr);
    }

    return json({
      ok: true,
      user_id: newUserId,
      email,
      magic_link: linkData?.properties?.action_link ?? null,
    });
  } catch (e: any) {
    console.error(LOG, "unhandled", e);
    return json({ error: e?.message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}