import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, TrendingUp, CloudOff, Loader2, Check, Timer, TimerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { Meta } from "./SageAtoms";

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
  onRetrySave?: () => void;
  restTimerEnabled?: boolean;
  onRestTimerToggle?: () => void;
}

const SaveStatusIndicator = ({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry?: () => void;
}) => {
  const { t } = useTranslation("session");
  if (status === "idle") return null;
  const isError = status === "error";
  const clickable = isError && !!onRetry;
  const className = cn(
    "inline-flex items-center gap-1 text-[10px] font-medium tabular-nums",
    status === "saving" && "text-muted-subtle",
    status === "saved" && "text-muted-foreground",
    isError && "text-destructive",
    clickable && "cursor-pointer hover:underline"
  );
  const content = (
    <>
      {status === "saving" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
      {status === "saved" && <Check className="w-2.5 h-2.5" />}
      {status === "error" && <CloudOff className="w-2.5 h-2.5" />}
      {status === "saving" && t("save_status_saving")}
      {status === "saved" && t("save_status_saved")}
      {status === "error" &&
        (clickable
          ? t("save_status_retry", { defaultValue: "Réessayer" })
          : t("save_status_error"))}
    </>
  );
  return clickable ? (
    <button type="button" onClick={onRetry} className={className}>
      {content}
    </button>
  ) : (
    <span className={className}>{content}</span>
  );
};

const HeaderBtn = ({
  onClick,
  ariaLabel,
  active,
  danger,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={cn(
      "w-11 h-11 rounded-sm border border-border bg-card flex items-center justify-center transition-colors",
      active
        ? "text-foreground border-foreground/30"
        : danger
          ? "text-muted-foreground hover:text-destructive"
          : "text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

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
  onRetrySave,
  restTimerEnabled,
  onRestTimerToggle,
}: WorkoutStatsBarProps) => {
  const { t } = useTranslation(["session", "common"]);
  const isAdvanced = useIsAdvanced();
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const totalVolume = useMemo(() => {
    let vol = 0;
    Object.values(completedSets).forEach((sets) => {
      sets.forEach((s) => {
        if (s.weight > 0 && s.reps > 0) vol += s.weight * s.reps;
      });
    });
    return vol;
  }, [completedSets]);

  const totalSetsDone = useMemo(() => {
    let count = 0;
    Object.values(completedSets).forEach((sets) => {
      sets.forEach((s) => {
        if (s.reps > 0) count++;
      });
    });
    return count;
  }, [completedSets]);

  const completedProgress =
    totalExercises > 0 ? (completedExerciseCount / totalExercises) * 100 : 0;
  const inProgressProgress =
    totalExercises > 0 ? (inProgressExerciseCount / totalExercises) * 100 : 0;

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      {/* Header row — sober, mirrors SessionPreview */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <HeaderBtn onClick={onBack} ariaLabel={t("session:quit") as string}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        </HeaderBtn>

        <div className="flex-1 min-w-0 text-center">
          <div className="text-[9px] uppercase tracking-[0.12em] font-semibold text-muted-subtle mb-0.5 flex items-center justify-center gap-2">
            <span>{t("session:in_progress", "En cours")}</span>
            <SaveStatusIndicator status={saveStatus} onRetry={onRetrySave} />
          </div>
          <div className="text-sm font-bold text-foreground tracking-tight truncate">
            {sessionTitle}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onRestTimerToggle && (
            <HeaderBtn
              onClick={onRestTimerToggle}
              ariaLabel={restTimerEnabled ? "Désactiver le timer" : "Activer le timer"}
              active={restTimerEnabled}
            >
              {restTimerEnabled
                ? <Timer className="w-4 h-4" strokeWidth={1.5} />
                : <TimerOff className="w-4 h-4" strokeWidth={1.5} />}
            </HeaderBtn>
          )}
          {isAdvanced && onProgression && (
            <HeaderBtn
              onClick={onProgression}
              ariaLabel={t("session:progression_plan") as string}
              active={showProgression}
            >
              <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
            </HeaderBtn>
          )}
          {showDelete && onDelete && (
            <HeaderBtn onClick={onDelete} ariaLabel="Delete" danger>
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </HeaderBtn>
          )}
        </div>
      </div>

      {/* Meta strip — identical structure to SessionPreview */}
      <div className="grid grid-cols-3 px-4 py-3 border-t border-border">
        <Meta
          value={`${mins}:${secs.toString().padStart(2, "0")}`}
          label={t("session:duration", "Durée") as string}
        />
        <Meta
          value={totalVolume > 0 ? (totalVolume / 1000).toFixed(1) : "—"}
          unit={totalVolume > 0 ? "T" : undefined}
          label={t("session:volume", "Volume") as string}
          border
        />
        <Meta
          value={
            <>
              <span className="text-foreground">{completedExerciseCount}</span>
              <span className="text-muted-subtle font-bold">/{totalExercises}</span>
            </>
          }
          label={`Ex · ${totalSetsDone} sets`}
        />
      </div>

      {/* Progress bar — fine, sober */}
      <div className="h-[2px] bg-bg-tinted relative overflow-hidden">
        <motion.div
          className="h-full bg-foreground/25 absolute top-0 left-0"
          initial={{ width: 0 }}
          animate={{ width: `${completedProgress + inProgressProgress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
        <motion.div
          className="h-full bg-foreground absolute top-0 left-0"
          initial={{ width: 0 }}
          animate={{ width: `${completedProgress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
};

export default WorkoutStatsBar;
