import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

function htmlResponse(message: string, returnUrl: string, ok: boolean) {
  const safeReturn = returnUrl || "/";
  const status = ok ? "success" : "error";
  const sep = safeReturn.includes("?") ? "&" : "?";
  const target = `${safeReturn}${sep}strava=${status}`;
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Strava</title>
<meta http-equiv="refresh" content="1;url=${target}">
<style>body{font-family:system-ui;background:#0F172A;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.box{text-align:center;padding:2rem}.ok{color:#10b981}.err{color:#ef4444}</style>
</head><body><div class="box">
<h1 class="${ok ? "ok" : "err"}">${ok ? "✅ Connecté à Strava" : "❌ Erreur Strava"}</h1>
<p>${message}</p><p><a style="color:#6C5CE7" href="${target}">Retourner à l'app</a></p>
</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Decode state to get returnUrl early (for redirects on error)
  let returnUrl = "";
  let userId = "";
  if (stateRaw) {
    try {
      const padded = stateRaw.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(padded + "===".slice(0, (4 - padded.length % 4) % 4)));
      returnUrl = decoded.ret || "";
      userId = decoded.uid || "";
    } catch (e) {
      console.error("Failed to decode state:", e);
    }
  }

  if (error) {
    return htmlResponse(`Strava a refusé l'accès: ${error}`, returnUrl, false);
  }
  if (!code || !userId) {
    return htmlResponse("Paramètres manquants", returnUrl, false);
  }

  const clientId = Deno.env.get("STRAVA_CLIENT_ID");
  const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return htmlResponse("Credentials Strava manquants côté serveur", returnUrl, false);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Strava token exchange failed:", tokenData);
      return htmlResponse(
        `Échec de l'échange de tokens: ${tokenData.message ?? "unknown"}`,
        returnUrl,
        false,
      );
    }

    const { access_token, refresh_token, expires_at, athlete, scope } = tokenData;

    // Save with service role (we bypass RLS because the user is identified by state)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: upsertErr } = await admin
      .from("strava_connections")
      .upsert({
        user_id: userId,
        strava_athlete_id: athlete?.id ?? 0,
        access_token,
        refresh_token,
        token_expires_at: new Date(expires_at * 1000).toISOString(),
        scope: scope ?? "read,activity:read_all",
        strava_profile: athlete ?? null,
      }, { onConflict: "user_id" });

    if (upsertErr) {
      console.error("DB upsert failed:", upsertErr);
      return htmlResponse(`Erreur DB: ${upsertErr.message}`, returnUrl, false);
    }

    return htmlResponse(
      `Bienvenue ${athlete?.firstname ?? ""} ! Redirection...`,
      returnUrl,
      true,
    );
  } catch (e) {
    console.error("strava-oauth-callback error:", e);
    return htmlResponse(
      e instanceof Error ? e.message : "Erreur inconnue",
      returnUrl,
      false,
    );
  }
});