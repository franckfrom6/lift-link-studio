import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // List all users
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("listUsers error:", listError);
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const users = usersData?.users ?? [];
    console.log(`Found ${users.length} users`);

    const results = [];
    for (const user of users) {
      try {
        // Re-update each user to force GoTrue to fix internal token fields
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });
        results.push({ 
          email: user.email, 
          fixed: !updateError, 
          error: updateError?.message 
        });
        console.log(`Updated ${user.email}: ${updateError ? updateError.message : 'OK'}`);
      } catch (e) {
        results.push({ email: user.email, fixed: false, error: String(e) });
        console.error(`Error updating ${user.email}:`, e);
      }
    }

    return new Response(JSON.stringify({ message: "Users re-confirmed", count: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
