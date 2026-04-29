import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Dumbbell, Trash2, TrendingUp, CloudOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface WorkoutStatsBarProps {
  elapsed: number;
  completedSets: Record<string, { weight: number; reps: number }[]>;
  totalExercises: number;
  completedExerciseCount: number;
  inProgressExerciseCount?: number;
  sessionTitle: string;
  onBack: () => void;
  onMenu?: () => void;
  onProgression?: () => void;
  showProgression?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  saveStatus?: SaveStatus;
}

const SaveStatusIndicator = ({ status }: { status: SaveStatus }) => {
  const { t } = useTranslation("session");
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1">
      {status === "saving" && <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />}
      {status === "saved" && <Check className="w-3 h-3 text-primary" />}
      {status === "error" && <CloudOff className="w-3 h-3 text-destructive" />}
      <span className={cn(
        "text-[10px] font-medium",
        status === "saving" && "text-muted-foreground",
        status === "saved" && "text-primary",
        status === "error" && "text-destructive",
      )}>
        {status === "saving" && t("save_status_saving")}
        {status === "saved" && t("save_status_saved")}
        {status === "error" && t("save_status_error")}
      </span>
    </div>
  );
};

const WorkoutStatsBar = ({
  elapsed,
  completedSets,
  totalExercises,
  completedExerciseCount,
  inProgressExerciseCount = 0,
  sessionTitle,
  onBack,
  onProgression,
  showProgression,
  showDelete,
  onDelete,
  saveStatus = "idle",
}: WorkoutStatsBarProps) => {
  const { t } = useTranslation(["session", "common"]);
  const isAdvanced = useIsAdvanced();
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // Calculate total volume (kg × reps)
  const totalVolume = useMemo(() => {
    let vol = 0;
    Object.values(completedSets).forEach((sets) => {
      sets.forEach((s) => {
        if (s.weight > 0 && s.reps > 0) vol += s.weight * s.reps;
      });
    });
    return vol;
  }, [completedSets]);

  // Total sets done
  const totalSetsDone = useMemo(() => {
    let count = 0;
    Object.values(completedSets).forEach((sets) => {
      sets.forEach((s) => { if (s.reps > 0) count++; });
    });
    return count;
  }, [completedSets]);

  const completedProgress = totalExercises > 0 ? (completedExerciseCount / totalExercises) * 100 : 0;
  const inProgressProgress = totalExercises > 0 ? (inProgressExerciseCount / totalExercises) * 100 : 0;

  return (
    <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
      {/* Top row: back + title + actions */}
      <div className="flex items-center justify-between px-2 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-11 w-11 text-muted-foreground hover:text-foreground"
          aria-label={t("session:quit")}
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>

        <div className="flex flex-col items-center mx-2 flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-muted-foreground truncate w-full text-center">
            {sessionTitle}
          </p>
          <SaveStatusIndicator status={saveStatus} />
        </div>

        <div className="flex items-center gap-1">
          {isAdvanced && onProgression && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onProgression}
              className={cn(
                "h-11 w-11",
                showProgression ? "text-primary" : "text-muted-foreground"
              )}
            >
              <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          )}
          {showDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-11 w-11 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>

      {/* Hero stats — Logger pattern: massive timer + supporting metrics */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-end justify-between gap-4">
          {/* Timer XL — the protagonist */}
          <div className="flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold mb-1">
              {t("session:duration", "Durée")}
            </span>
            <span className="text-4xl font-black tabular-nums text-foreground leading-none">
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </div>

          {/* Right cluster: volume · sets · progress */}
          <div className="flex items-end gap-4 pb-0.5">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                <Dumbbell className="w-2.5 h-2.5" strokeWidth={2} />
                {t("session:volume", "Volume")}
              </span>
              <span className="text-base font-bold tabular-nums text-foreground">
                {totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : "—"}
              </span>
            </div>
            <div className="flex flex-col items-end leading-none">
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" strokeWidth={2} />
                Sets
              </span>
              <span className="text-base font-bold tabular-nums text-foreground">
                {totalSetsDone}
              </span>
            </div>
            <div className="flex flex-col items-end leading-none">
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold mb-1">
                Ex.
              </span>
              <span className="text-base font-black tabular-nums text-primary">
                {completedExerciseCount}<span className="text-muted-foreground font-bold">/{totalExercises}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar — primary (bleu/orange selon thème) */}
      <div className="h-1 bg-secondary relative overflow-hidden">
        <motion.div
          className="h-full bg-primary/35 absolute top-0 left-0"
          initial={{ width: 0 }}
          animate={{ width: `${completedProgress + inProgressProgress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
        <motion.div
          className="h-full bg-primary absolute top-0 left-0"
          initial={{ width: 0 }}
          animate={{ width: `${completedProgress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
};

export default WorkoutStatsBar;
