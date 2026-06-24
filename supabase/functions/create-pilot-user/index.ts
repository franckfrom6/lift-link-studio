import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user: caller } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin status
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_admin")
      .eq("user_id", caller.id)
      .single();

    if (!profile?.is_admin) throw new Error("Not admin");

    const { email, password, full_name, role } = await req.json();

    // Create user with service role
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) throw createError;

    // Upsert profile (trigger on_auth_user_created may have already inserted
    // an empty row — use upsert so we always set full_name, role, onboarding_completed)
    const { error: profileError } = await adminClient.from("profiles").upsert({
      user_id: newUser.user.id,
      full_name,
      role,
      onboarding_completed: true,
    }, { onConflict: "user_id" });

    if (profileError) throw profileError;

    // Send welcome email with credentials (non-blocking — log on failure)
    try {
      await adminClient.functions.invoke("send-transactional-email", {
        body: {
          templateName: "pilot-welcome",
          recipientEmail: email,
          idempotencyKey: `pilot-welcome-${newUser.user.id}`,
          templateData: {
            firstName: full_name?.split(" ")[0] || "",
            email,
            tempPassword: password,
            role,
          },
        },
      });
    } catch (emailErr) {
      console.error("Failed to send welcome email", emailErr);
    }

    return new Response(JSON.stringify({ user_id: newUser.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
