import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Clock, Flame, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "sonner";

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

const NotificationSettings = () => {
  const { t } = useTranslation(["settings", "common"]);
  const { user, profile, refreshProfile } = useAuth();
  const isAdvanced = useIsAdvanced();

  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
  const [sessionReminder, setSessionReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [streakMotivation, setStreakMotivation] = useState(true);
  const [coachMessages, setCoachMessages] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load from profile
  useEffect(() => {
    if (profile) {
      setSessionReminder((profile as any).notif_session_reminder ?? true);
      setReminderTime((profile as any).notif_session_reminder_time?.slice(0, 5) ?? "08:00");
      setStreakMotivation((profile as any).notif_streak_motivation ?? true);
      setCoachMessages((profile as any).notif_coach_messages ?? true);
    }
  }, [profile]);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error(t("notif_not_supported"));
      return;
    }
    const permission = await Notification.requestPermission();
    setPermissionState(permission);
    if (permission === "granted") {
      toast.success(t("notif_granted"));
      // Store subscription if service worker available
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager?.subscribe({
            userVisibleOnly: true,
          });
          if (sub && user) {
            await supabase
              .from("profiles")
              .update({ push_subscription: JSON.stringify(sub) } as any)
              .eq("user_id", user.id);
          }
        } catch (e) {
          console.warn("Push subscription failed:", e);
        }
      }
    } else {
      toast.error(t("notif_denied"));
    }
  };

  const sendTestNotification = () => {
    if (permissionState !== "granted") {
      toast.error(t("notif_permission_required"));
      return;
    }
    try {
      new Notification(t("notif_test_title"), {
        body: t("notif_test_body"),
        icon: "/favicon.svg",
        tag: "test-notification",
      });
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      toast.success(t("notif_test_sent"));
    } catch {
      toast.error(t("notif_test_error"));
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        notif_session_reminder: sessionReminder,
        notif_session_reminder_time: reminderTime + ":00",
        notif_streak_motivation: streakMotivation,
        notif_coach_messages: coachMessages,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast.error(t("common:save_error"));
    } else {
      toast.success(t("common:saved"));
      refreshProfile();
    }
    setSaving(false);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" strokeWidth={1.5} />
        <h3 className="font-semibold text-base">{t("notif_title")}</h3>
      </div>

      {/* Permission banner */}
      {permissionState !== "granted" && (
        <div className="bg-warning-bg border border-warning/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <BellOff className="w-4 h-4 text-warning" strokeWidth={1.5} />
            <p className="text-sm font-medium">{t("notif_permission_banner")}</p>
          </div>
          {isIOS && (
            <p className="text-xs text-muted-foreground">{t("notif_ios_note")}</p>
          )}
          <Button size="sm" onClick={requestPermission} className="mt-1">
            {t("notif_authorize")}
          </Button>
        </div>
      )}

      {/* Session reminder */}
      <div className="glass p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium">{t("notif_session_reminder")}</span>
          </div>
          <Switch checked={sessionReminder} onCheckedChange={setSessionReminder} />
        </div>
        {isAdvanced && sessionReminder && (
          <div className="flex items-center gap-2 pl-6">
            <span className="text-xs text-muted-foreground">{t("notif_send_at")}</span>
            <Select value={reminderTime} onValueChange={setReminderTime}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map(h => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Streak motivation */}
      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium">{t("notif_streak")}</span>
          </div>
          <Switch checked={streakMotivation} onCheckedChange={setStreakMotivation} />
        </div>
        {isAdvanced && streakMotivation && (
          <p className="text-xs text-muted-foreground mt-2 pl-6">{t("notif_streak_detail")}</p>
        )}
      </div>

      {/* Coach messages */}
      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium">{t("notif_coach_messages")}</span>
          </div>
          <Switch checked={coachMessages} onCheckedChange={setCoachMessages} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={savePreferences} disabled={saving} className="flex-1">
          {saving ? t("common:saving") : t("common:save")}
        </Button>
        {permissionState === "granted" && (
          <Button variant="outline" onClick={sendTestNotification} className="gap-1.5">
            <Smartphone className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("notif_test")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
