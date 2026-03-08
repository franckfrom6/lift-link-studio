import { cn } from "@/lib/utils";
import { ExternalSessionData } from "./ExternalSessionForm";
import { ACTIVITY_TYPES } from "@/data/activity-types";

interface WeeklyLoadBarProps {
  programmedSessions: number; // count of programmed sessions
  externalSessions: ExternalSessionData[];
  className?: string;
}

const WeeklyLoadBar = ({ programmedSessions, externalSessions, className }: WeeklyLoadBarProps) => {
  // Simple load calculation:
  // Programmed session = 60 load units (duration × moderate intensity)
  // External session = duration × intensity / 10
  const programLoad = programmedSessions * 60;
  const externalLoad = externalSessions.reduce((sum, s) => {
    return sum + (s.duration_minutes * s.intensity_perceived / 10);
  }, 0);
  const totalLoad = programLoad + externalLoad;

  // Thresholds (arbitrary but reasonable for 1 session/week athlete)
  // Green: < 120, Orange: 120-200, Red: > 200
  const status = totalLoad <= 120 ? "ok" : totalLoad <= 200 ? "elevated" : "overload";

  const statusConfig = {
    ok: { color: "bg-success", label: "Charge OK", textColor: "text-success" },
    elevated: { color: "bg-warning", label: "Charge élevée", textColor: "text-warning" },
    overload: { color: "bg-destructive", label: "Surcharge ⚠️", textColor: "text-destructive" },
  }[status];

  const maxLoad = 300;
  const fillPercent = Math.min((totalLoad / maxLoad) * 100, 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Charge hebdo
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
        <span>🏋️ {programmedSessions} séance{programmedSessions > 1 ? "s" : ""} programmée{programmedSessions > 1 ? "s" : ""}</span>
        {externalSessions.length > 0 && (
          <span>
            {externalSessions.map(s => ACTIVITY_TYPES.find(t => t.id === s.activity_type)?.emoji || "➕").join("")}
            {" "}{externalSessions.length} externe{externalSessions.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
};

export default WeeklyLoadBar;
