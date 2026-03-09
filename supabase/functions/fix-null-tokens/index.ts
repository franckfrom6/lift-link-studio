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

  // Fix NULL confirmation_token, recovery_token, email_change_token_new, email_change_token_current
  // These NULL values cause GoTrue scan errors on login
  const { data, error } = await supabaseAdmin.rpc('fix_null_auth_tokens' as any);
  
  if (error) {
    // If the RPC doesn't exist, try direct SQL via a different approach
    // We'll use the admin API to list and re-confirm users instead
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const user of users.users) {
      // Re-update each user to force GoTrue to fix internal token fields
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });
      results.push({ 
        email: user.email, 
        fixed: !updateError, 
        error: updateError?.message 
      });
    }

    return new Response(JSON.stringify({ message: "Users re-confirmed", results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Tokens fixed", data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
