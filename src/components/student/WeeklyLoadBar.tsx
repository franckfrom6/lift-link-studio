import { cn } from "@/lib/utils";
import { ExternalSessionData } from "./ExternalSessionForm";
import { ACTIVITY_TYPES } from "@/data/activity-types";
import { useTranslation } from "react-i18next";

interface WeeklyLoadBarProps {
  programmedSessions: number;
  externalSessions: ExternalSessionData[];
  className?: string;
}

const WeeklyLoadBar = ({ programmedSessions, externalSessions, className }: WeeklyLoadBarProps) => {
  const { t } = useTranslation('recovery');

  const programLoad = programmedSessions * 60;
  const externalLoad = externalSessions.reduce((sum, s) => {
    return sum + (s.duration_minutes * s.intensity_perceived / 10);
  }, 0);
  const totalLoad = programLoad + externalLoad;

  const status = totalLoad <= 120 ? "ok" : totalLoad <= 200 ? "elevated" : "overload";

  const statusConfig = {
    ok: { color: "bg-success", label: t('load_ok'), textColor: "text-success" },
    elevated: { color: "bg-warning", label: t('load_high'), textColor: "text-warning" },
    overload: { color: "bg-destructive", label: t('load_overload'), textColor: "text-destructive" },
  }[status];

  const maxLoad = 300;
  const fillPercent = Math.min((totalLoad / maxLoad) * 100, 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('weekly_load')}
        </span>
        <span className={cn("text-[10px] font-bold", statusConfig.textColor)}>
          {statusConfig.label}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", statusConfig.color)}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>🏋️ {programmedSessions > 1 ? t('programmed_sessions_plural', { count: programmedSessions }) : t('programmed_sessions', { count: programmedSessions })}</span>
        {externalSessions.length > 0 && (
          <span>
            {externalSessions.map(s => ACTIVITY_TYPES.find(tp => tp.id === s.activity_type)?.emoji || "➕").join("")}
            {" "}{externalSessions.length > 1 ? t('external_count_plural', { count: externalSessions.length }) : t('external_count', { count: externalSessions.length })}
          </span>
        )}
      </div>
    </div>
  );
};

export default WeeklyLoadBar;