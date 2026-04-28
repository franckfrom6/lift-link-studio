import { useEffect, useState } from "react";
import { Activity, Loader2, Unlink, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";

type StravaConnection = {
  id: string;
  strava_athlete_id: number;
  strava_profile: any | null;
  last_sync_at: string | null;
  created_at: string;
};

const StravaConnectionCard = () => {
  const { t, i18n } = useTranslation("strava");
  const { user, session } = useAuth();
  const [connection, setConnection] = useState<StravaConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const dateLocale = i18n.language?.startsWith("fr") ? frLocale : enUS;

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
    const params = new URLSearchParams(window.location.search);
    const stravaStatus = params.get("strava");
    if (stravaStatus === "success") {
      toast.success(t("connect_success"));
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(load, 500);
    } else if (stravaStatus === "error") {
      toast.error(t("connect_error"));
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleConnect = async () => {
    if (!session) {
      toast.error(t("connect_error"));
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
      toast.error(e instanceof Error ? e.message : t("error_generic"));
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || !connection) return;
    if (!confirm(t("disconnect_confirm"))) return;
    const { error } = await supabase
      .from("strava_connections")
      .delete()
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("disconnect_success"));
    setConnection(null);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "strava-sync-activities",
        { body: {} },
      );
      if (error) {
        // FunctionsHttpError carries context.response with the status
        const status = (error as any)?.context?.response?.status as
          | number
          | undefined;
        let body: any = null;
        try {
          body = await (error as any)?.context?.response?.json?.();
        } catch (_) {}
        if (status === 401) {
          toast.error(t("error_reauth"), {
            action: {
              label: t("reconnect_button"),
              onClick: () => handleConnect(),
            },
          });
        } else if (status === 503) {
          toast.warning(t("error_rate_limit"));
        } else if (status === 502) {
          toast.error(t("error_strava_down"));
        } else {
          toast.error(body?.error ?? t("error_generic"));
        }
        return;
      }
      const newCount = data?.new_count ?? 0;
      const updatedCount = data?.updated_count ?? 0;
      if (newCount === 0 && updatedCount === 0) {
        toast.success(t("sync_no_changes"));
      } else if (updatedCount > 0) {
        toast.success(
          t("sync_success_with_updates", {
            new: newCount,
            updated: updatedCount,
          }),
        );
      } else {
        toast.success(t("sync_success", { new: newCount }));
      }
      await load();
    } catch (e) {
      console.error(e);
      toast.error(t("error_generic"));
    } finally {
      setSyncing(false);
    }
  };

  const profile = connection?.strava_profile ?? {};
  const fullName =
    `${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim() ||
    `#${connection?.strava_athlete_id ?? ""}`;
  const avatar = profile.profile_medium ?? profile.profile;
  const lastSyncLabel = connection?.last_sync_at
    ? t("last_sync_relative", {
        time: formatDistanceToNow(new Date(connection.last_sync_at), {
          addSuffix: true,
          locale: dateLocale,
        }),
      })
    : t("last_sync_never");

  return (
    <div className="glass p-5">
      <div className="flex items-start gap-4">
        {connection && avatar ? (
          <img
            src={avatar}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-[#FC4C02]/10 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-[#FC4C02]" strokeWidth={2} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{t("title")}</h3>
            {connection && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {fullName}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {connection ? lastSyncLabel : t("description_disconnected")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {loading ? (
          <Button disabled variant="outline" size="sm" className="min-h-[44px]">
            <Loader2 className="w-4 h-4 animate-spin" />
          </Button>
        ) : connection ? (
          <>
            <Button
              size="sm"
              className="min-h-[44px] bg-[#FC4C02] hover:bg-[#e64402] text-white"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("syncing")}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("sync_button")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              onClick={handleDisconnect}
              disabled={syncing}
            >
              <Unlink className="w-4 h-4 mr-2" />
              {t("disconnect_button")}
            </Button>
          </>
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
            {t("connect_button")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StravaConnectionCard;
