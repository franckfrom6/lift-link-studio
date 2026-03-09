import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    
    // Use the postgres module from Deno
    const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
    const sql = postgres(dbUrl, { ssl: "require" });

    // Fix NULL auth columns that make GoTrue crash on password login scans
    const result = await sql`
      UPDATE auth.users
      SET 
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        email_change = COALESCE(email_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        phone_change = COALESCE(phone_change, ''),
        reauthentication_token = COALESCE(reauthentication_token, '')
      WHERE 
        confirmation_token IS NULL 
        OR recovery_token IS NULL
        OR email_change_token_new IS NULL
        OR email_change_token_current IS NULL
        OR email_change IS NULL
        OR phone_change_token IS NULL
        OR phone_change IS NULL
        OR reauthentication_token IS NULL
    `;

    await sql.end();

    return new Response(JSON.stringify({ 
      message: "Fixed NULL tokens in auth.users",
      rows_affected: result.count
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
