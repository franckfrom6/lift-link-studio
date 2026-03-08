import { useTranslation } from "react-i18next";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { Activity, Dumbbell, Utensils } from "lucide-react";
import { Loader2 } from "lucide-react";

const EMOJI_MAP: Record<number, string> = { 1: "😫", 2: "😕", 3: "😐", 4: "🙂", 5: "😁" };

const WeeklySummaryCard = () => {
  const { t } = useTranslation("dashboard");
  const { summary, loading } = useStudentDashboard();

  if (loading) {
    return (
      <div className="glass p-6 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="glass p-5 space-y-4">
      <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">{t("this_week")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Sessions done */}
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <Activity className="w-5 h-5 mx-auto text-primary mb-1" strokeWidth={1.5} />
          <p className="text-2xl font-bold">{summary.programmedDone}/{summary.programmedTotal}</p>
          <p className="text-[11px] text-muted-foreground">{t("sessions_done")}</p>
          {summary.externalCount > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">+{summary.externalCount} {t("external").toLowerCase()}</p>
          )}
        </div>

        {/* Volume */}
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <Dumbbell className="w-5 h-5 mx-auto text-primary mb-1" strokeWidth={1.5} />
          <p className="text-2xl font-bold">{summary.totalVolume > 0 ? `${(summary.totalVolume / 1000).toFixed(1)}t` : "—"}</p>
          <p className="text-[11px] text-muted-foreground">{t("total_volume")}</p>
        </div>

        {/* Nutrition */}
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <Utensils className="w-5 h-5 mx-auto text-primary mb-1" strokeWidth={1.5} />
          <p className="text-2xl font-bold">{summary.nutritionDaysLogged}/{summary.totalDays}</p>
          <p className="text-[11px] text-muted-foreground">{t("days_logged")}</p>
        </div>

        {/* Check-in */}
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          {summary.checkin ? (
            <>
              <div className="flex justify-center gap-1 text-lg mb-1">
                <span title={t("energy")}>{EMOJI_MAP[summary.checkin.energy] || "❓"}</span>
                <span title={t("sleep")}>{EMOJI_MAP[summary.checkin.sleep] || "❓"}</span>
              </div>
              <div className="flex justify-center gap-1 text-lg">
                <span title={t("stress")}>{EMOJI_MAP[6 - summary.checkin.stress] || "❓"}</span>
                <span title={t("soreness")}>{EMOJI_MAP[6 - summary.checkin.soreness] || "❓"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{t("checkin_summary")}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold">—</p>
              <p className="text-[11px] text-muted-foreground">{t("no_checkin")}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklySummaryCard;
