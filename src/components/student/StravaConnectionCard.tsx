import { useEffect, useState } from "react";
import { Activity, Loader2, Unlink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type StravaConnection = {
  id: string;
  strava_athlete_id: number;
  strava_profile: any | null;
  last_sync_at: string | null;
  created_at: string;
};

const StravaConnectionCard = () => {
  const { user, session } = useAuth();
  const [connection, setConnection] = useState<StravaConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("strava_connections")
      .select("id, strava_athlete_id, strava_profile, last_sync_at, created_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) console.error("strava load:", error);
    setConnection((data as StravaConnection) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Detect callback redirect
    const params = new URLSearchParams(window.location.search);
    const stravaStatus = params.get("strava");
    if (stravaStatus === "success") {
      toast.success("Strava connecté avec succès !");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      // Reload connection state
      setTimeout(load, 500);
    } else if (stravaStatus === "error") {
      toast.error("Erreur lors de la connexion Strava");
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleConnect = async () => {
    if (!session) {
      toast.error("Vous devez être connecté");
      return;
    }
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "strava-oauth-start",
        { body: { return_url: window.location.origin + "/student/profile" } },
      );
      if (error || !data?.url) {
        throw new Error(error?.message ?? "URL d'authorization manquante");
      }
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Erreur");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || !connection) return;
    if (!confirm("Déconnecter Strava ? Tes activités déjà importées resteront.")) return;
    const { error } = await supabase
      .from("strava_connections")
      .delete()
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erreur: " + error.message);
      return;
    }
    toast.success("Strava déconnecté");
    setConnection(null);
  };

  return (
    <div className="glass p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#FC4C02]/10 flex items-center justify-center shrink-0">
          <Activity className="w-6 h-6 text-[#FC4C02]" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Strava</h3>
            {connection && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connecté
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {connection
              ? `Athlète Strava: ${connection.strava_profile?.firstname ?? ""} ${connection.strava_profile?.lastname ?? ""}`.trim() ||
                `ID #${connection.strava_athlete_id}`
              : "Importe automatiquement tes courses, vélo et autres activités."}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {loading ? (
          <Button disabled variant="outline" size="sm" className="min-h-[44px]">
            <Loader2 className="w-4 h-4 animate-spin" />
          </Button>
        ) : connection ? (
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={handleDisconnect}
          >
            <Unlink className="w-4 h-4 mr-2" /> Déconnecter
          </Button>
        ) : (
          <Button
            size="sm"
            className="min-h-[44px] bg-[#FC4C02] hover:bg-[#e64402] text-white"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 mr-2" />
            )}
            Connecter Strava
          </Button>
        )}
      </div>
    </div>
  );
};

export default StravaConnectionCard;