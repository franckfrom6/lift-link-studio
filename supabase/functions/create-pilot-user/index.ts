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

    // Create user with service role — if already exists, look it up and reuse
    let userId: string | null = null;
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      const msg = (createError.message || "").toLowerCase();
      const alreadyExists =
        msg.includes("already been registered") ||
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        (createError as any).status === 422;
      if (!alreadyExists) throw createError;

      // Find existing user by email (paginate through users)
      let found: any = null;
      for (let page = 1; page <= 20 && !found; page++) {
        const { data: list, error: listErr } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
        if (listErr) throw listErr;
        found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!list.users.length || list.users.length < 200) break;
      }
      if (!found) throw new Error("User exists but could not be located");
      userId = found.id;

      // Reset password so the temp password works
      await adminClient.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      userId = newUser.user.id;
    }

    // Upsert profile (trigger on_auth_user_created may have already inserted
    // an empty row — use upsert so we always set full_name, role, onboarding_completed)
    const { error: profileError } = await adminClient.from("profiles").upsert({
      user_id: userId,
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
          idempotencyKey: `pilot-welcome-${userId}`,
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

    return new Response(JSON.stringify({ user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
