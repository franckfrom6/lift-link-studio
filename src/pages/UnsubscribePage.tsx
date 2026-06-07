import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, AlertCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({ token }),
        }
      );
      const data = await res.json();
      if (data.success || data.reason === "already_unsubscribed") setState("done");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <div className="glass max-w-md w-full p-8 text-center space-y-5">
        {state === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Vérification du lien…</p>
          </>
        )}
        {state === "valid" && (
          <>
            <MailX className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-xl font-bold">Se désabonner des emails</h1>
            <p className="text-sm text-muted-foreground">
              Tu ne recevras plus d'emails de 6way à cette adresse.
            </p>
            <Button onClick={confirm} className="w-full">Confirmer le désabonnement</Button>
          </>
        )}
        {state === "submitting" && (
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-muted-foreground" />
        )}
        {(state === "done" || state === "already") && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-xl font-bold">Désabonnement confirmé</h1>
            <p className="text-sm text-muted-foreground">
              Tu ne recevras plus d'emails de 6way.
            </p>
          </>
        )}
        {(state === "invalid" || state === "error") && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h1 className="text-xl font-bold">Lien invalide</h1>
            <p className="text-sm text-muted-foreground">
              Ce lien de désabonnement n'est pas valide ou a expiré.
            </p>
          </>
        )}
      </div>
    </div>
  );
}