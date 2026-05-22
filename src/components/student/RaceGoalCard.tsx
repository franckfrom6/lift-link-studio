import { differenceInCalendarWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RACE_TYPE_LABELS } from "@/types/running";

interface RaceGoalCardProps {
  raceGoal: {
    race_type: string;
    target_date: string;
    target_time_min?: number | null;
    current_weekly_km?: number | null;
  } | null;
  weeklyKm?: number;
  onSetGoal: () => void;
  onEditGoal: () => void;
}

function formatTargetTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m} min`;
}

const RaceGoalCard = ({ raceGoal, weeklyKm = 0, onSetGoal, onEditGoal }: RaceGoalCardProps) => {
  if (!raceGoal) {
    return (
      <button
        type="button"
        onClick={onSetGoal}
        className="mx-4 mb-3 w-[calc(100%-2rem)] bg-bg-tinted rounded-lg p-3 text-left text-sm font-medium text-foreground hover:bg-accent/40 transition-colors flex items-center justify-between min-h-[44px]"
      >
        <span>🏁 Préparer une course ?</span>
        <span className="text-muted-foreground">→</span>
      </button>
    );
  }

  const target = new Date(raceGoal.target_date);
  const weeksLeft = Math.max(0, differenceInCalendarWeeks(target, new Date()));
  const targetKm = raceGoal.current_weekly_km || 0;
  const pct = targetKm > 0 ? Math.min(100, (weeklyKm / targetKm) * 100) : 0;

  const formattedDate = target.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="mx-4 mb-3 rounded-xl border border-border p-4 space-y-2 bg-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>🏁</span>
          <span className="px-2 py-0.5 rounded-md bg-bg-tinted text-xs font-semibold text-foreground">
            {RACE_TYPE_LABELS[raceGoal.race_type] || raceGoal.race_type}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          Dans {weeksLeft} semaine{weeksLeft > 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formattedDate}</span>
        {raceGoal.target_time_min ? (
          <span className="font-medium text-foreground tabular-nums">
            Objectif : {formatTargetTime(raceGoal.target_time_min)}
          </span>
        ) : null}
      </div>

      {targetKm > 0 && (
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Volume cette semaine</span>
            <span className="font-semibold tabular-nums">
              {weeklyKm.toFixed(1)} / {targetKm} km
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 px-2 min-h-[44px] sm:min-h-0"
          onClick={onEditGoal}
        >
          Modifier
        </Button>
      </div>
    </div>
  );
};

export default RaceGoalCard;