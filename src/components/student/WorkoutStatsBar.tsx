import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Zap, Dumbbell, MoreVertical, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";

interface WorkoutStatsBarProps {
  elapsed: number;
  completedSets: Record<string, { weight: number; reps: number }[]>;
  totalExercises: number;
  completedExerciseCount: number;
  sessionTitle: string;
  onBack: () => void;
  onMenu?: () => void;
  onProgression?: () => void;
  showProgression?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
}

const WorkoutStatsBar = ({
  elapsed,
  completedSets,
  totalExercises,
  completedExerciseCount,
  sessionTitle,
  onBack,
  onProgression,
  showProgression,
  showDelete,
  onDelete,
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

  const progress = totalExercises > 0 ? (completedExerciseCount / totalExercises) * 100 : 0;

  return (
    <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800">
      {/* Top row: back + title + timer */}
      <div className="flex items-center justify-between px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          aria-label={t("session:quit")}
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>

        <p className="text-sm font-semibold text-zinc-100 truncate mx-2 flex-1 text-center">
          {sessionTitle}
        </p>

        <div className="flex items-center gap-1">
          {isAdvanced && onProgression && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onProgression}
              className={cn(
                "h-10 w-10 hover:bg-zinc-800",
                showProgression ? "text-primary" : "text-zinc-400"
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
              className="h-10 w-10 text-zinc-400 hover:text-destructive hover:bg-zinc-800"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
          <span className="text-sm font-bold tabular-nums text-zinc-100">
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Dumbbell className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
          <span className="text-xs font-semibold text-zinc-300">
            {totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : "0kg"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
          <span className="text-xs font-semibold text-zinc-300 tabular-nums">
            {totalSetsDone} sets
          </span>
        </div>

        <span className="text-xs font-bold tabular-nums text-primary">
          {completedExerciseCount}/{totalExercises}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-zinc-800">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
};

export default WorkoutStatsBar;
