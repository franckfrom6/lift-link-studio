import { useState } from "react";
import { ChevronDown, Dumbbell, X, Check, Plus, ArrowLeftRight, Timer, Route, SkipForward, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CircularRestTimer from "./CircularRestTimer";
import RestTimer from "./RestTimer";
import { ExerciseVideoEmbed } from "./ExerciseVideoEmbed";
import RPESelector from "./RPESelector";
import CoachInstructionsButton from "./CoachInstructionsButton";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import ExercisePhoto from "./ExercisePhoto";

export type TrackingType = "weight_reps" | "reps_only" | "duration" | "distance";

export interface EnhancedCompletedSet {
  setNumber: number;
  weight: number;
  reps: number;
  isFailure: boolean;
  rpeActual: number | null;
  durationSeconds?: number;
}

interface EnhancedExerciseCardProps {
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  tempo?: string | null;
  rpeTarget?: string | null;
  suggestedWeight?: number | null;
  coachNotes?: string | null;
  videoUrl?: string | null;
  videoSearchQuery?: string | null;
  isActive: boolean;
  completedSets: EnhancedCompletedSet[];
  onCompletedSetsChange: (sets: EnhancedCompletedSet[]) => void;
  onAllSetsComplete: () => void;
  onSwapExercise?: () => void;
  onSkipExercise?: () => void;
  hasAlternatives?: boolean;
  isSubstituted?: boolean;
  isSkipped?: boolean;
  previousSets?: { weight: number; reps: number }[];
  trackingType?: TrackingType;
  sessionExerciseId?: string;
  completedSessionId?: string;
}

const EnhancedExerciseCard = ({
  name, sets: targetSets, repsMin, repsMax, restSeconds,
  tempo, rpeTarget, suggestedWeight, coachNotes,
  videoUrl, videoSearchQuery,
  isActive, completedSets, onCompletedSetsChange, onAllSetsComplete,
  onSwapExercise, onSkipExercise, hasAlternatives, isSubstituted, isSkipped,
  previousSets,
  trackingType = "weight_reps",
  sessionExerciseId,
  completedSessionId,
}: EnhancedExerciseCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation('exercises');
  const isAdvanced = useIsAdvanced();
  const [currentSetIdx, setCurrentSetIdx] = useState(
    completedSets.findIndex(s => s.reps === 0 && (s.durationSeconds || 0) === 0) >= 0
      ? completedSets.findIndex(s => s.reps === 0 && (s.durationSeconds || 0) === 0)
      : completedSets.length < targetSets ? completedSets.length : -1
  );
  const [showTimer, setShowTimer] = useState(false);
  const [allDone, setAllDone] = useState(
    completedSets.length >= targetSets && completedSets.every(s => 
      trackingType === "duration" ? (s.durationSeconds || 0) > 0 : s.reps > 0
    )
  );

  if (completedSets.length === 0 && isActive) {
    const initial: EnhancedCompletedSet[] = Array.from({ length: targetSets }, (_, i) => ({
      setNumber: i + 1,
      weight: trackingType === "weight_reps" ? (suggestedWeight || 0) : 0,
      reps: 0,
      isFailure: false,
      rpeActual: null,
      durationSeconds: 0,
    }));
    onCompletedSetsChange(initial);
    return null;
  }

  const updateSet = (idx: number, field: keyof EnhancedCompletedSet, value: any) => {
    const updated = [...completedSets];
    updated[idx] = { ...updated[idx], [field]: value };
    onCompletedSetsChange(updated);
  };

  const isSetComplete = (set: EnhancedCompletedSet) => {
    if (trackingType === "duration") return (set.durationSeconds || 0) > 0;
    return set.reps > 0;
  };

  const validateSet = (idx: number) => {
    if (idx < completedSets.length - 1) {
      setCurrentSetIdx(idx + 1);
      const updated = [...completedSets];
      if (trackingType === "weight_reps" && updated[idx + 1] && updated[idx + 1].weight === 0) {
        updated[idx + 1] = { ...updated[idx + 1], weight: updated[idx].weight };
        onCompletedSetsChange(updated);
      }
      setShowTimer(true);
    } else {
      setAllDone(true);
      setCurrentSetIdx(-1);
      onAllSetsComplete();
    }
  };

  const addSet = () => {
    const lastWeight = completedSets[completedSets.length - 1]?.weight || 0;
    onCompletedSetsChange([
      ...completedSets,
      { setNumber: completedSets.length + 1, weight: lastWeight, reps: 0, isFailure: false, rpeActual: null, durationSeconds: 0 }
    ]);
    if (allDone) {
      setAllDone(false);
      setCurrentSetIdx(completedSets.length);
    }
  };

  const getPrevComparison = (idx: number, field: "weight" | "reps") => {
    if (!isAdvanced) return null; // Hide comparison in Simple mode
    if (!previousSets || !previousSets[idx]) return null;
    const current = completedSets[idx]?.[field] || 0;
    const prev = previousSets[idx][field];
    if (current === 0 || prev === 0) return null;
    if (current > prev) return "up";
    if (current < prev) return "down";
    return "same";
  };

  const formatDuration = (secs: number) => {
    if (secs >= 60) return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
    return `${secs}s`;
  };

  // Tags display based on tracking type
  const renderTags = () => {
    switch (trackingType) {
      case "duration":
        return (
          <>
            <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium">
              {targetSets}s
            </span>
            <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-0.5">
              <Timer className="w-2.5 h-2.5" />
              {repsMin >= 60 ? `${Math.floor(repsMin / 60)}min` : `${repsMin}s`}
            </span>
          </>
        );
      case "reps_only":
        return (
          <>
            <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium">
              {targetSets}×{repsMin === repsMax ? repsMin : `${repsMin}-${repsMax}`}
            </span>
          </>
        );
      case "distance":
        return (
          <>
            <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-0.5">
              <Route className="w-2.5 h-2.5" />
              {repsMin}m
            </span>
            <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium">
              {targetSets}s
            </span>
          </>
        );
      default: // weight_reps
        return (
          <>
            <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium">
              {targetSets}s
            </span>
            <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium">
              {repsMin === repsMax ? repsMin : `${repsMin}-${repsMax}`} reps
            </span>
          </>
        );
    }
  };

  // Grid header and row based on tracking type
  const renderSetHeader = () => {
    switch (trackingType) {
      case "duration":
        return (
          <div className="grid grid-cols-[36px_1fr_40px] gap-1.5 min-w-[200px] text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
            <span>Set</span>
            <span>{t('duration_sec', 'Durée (s)')}</span>
            <span></span>
          </div>
        );
      case "reps_only":
        return (
          <div className="grid grid-cols-[36px_1fr_40px_40px] gap-1.5 min-w-[240px] text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
            <span>Set</span>
            <span>Reps</span>
            <span className="text-center">Fail</span>
            <span></span>
          </div>
        );
      case "distance":
        return (
          <div className="grid grid-cols-[36px_1fr_1fr_40px] gap-1.5 min-w-[260px] text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
            <span>Set</span>
            <span>{t('distance_m', 'Dist. (m)')}</span>
            <span>{t('duration_sec', 'Durée (s)')}</span>
            <span></span>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-[36px_1fr_1fr_40px_40px] gap-1.5 min-w-[280px] text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
            <span>Set</span>
            <span>Kg</span>
            <span>Reps</span>
            <span className="text-center">Fail</span>
            <span></span>
          </div>
        );
    }
  };

  const renderSetRow = (set: EnhancedCompletedSet, i: number) => {
    const isCurrent = i === currentSetIdx && !allDone;
    const isDone = i < currentSetIdx || allDone;
    const rowClass = cn(
      "gap-1.5 items-center p-1.5 rounded-lg transition-colors",
      isCurrent && "bg-accent ring-1 ring-accent-foreground/20",
      isDone && "opacity-60"
    );
    const inputClass = "h-9 text-center bg-background text-sm font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    const checkButton = isCurrent ? (
      <Button size="icon" className="h-9 w-9" onClick={() => validateSet(i)} disabled={!isSetComplete(set)}>
        <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
      </Button>
    ) : (
      <div className="h-9 w-9 flex items-center justify-center">
        {isDone && <Check className="w-3.5 h-3.5 text-success" strokeWidth={1.5} />}
      </div>
    );

    switch (trackingType) {
      case "duration":
        return (
          <div key={i} className={cn("grid grid-cols-[36px_1fr_40px]", rowClass)}>
            <span className="text-sm font-bold text-center">{set.setNumber}</span>
            <Input
              type="number"
              value={set.durationSeconds || ""}
              onChange={(e) => updateSet(i, "durationSeconds", Number(e.target.value))}
              placeholder="0"
              className={inputClass}
              disabled={!isCurrent}
              min={0}
            />
            {checkButton}
          </div>
        );
      case "reps_only":
        return (
          <div key={i}>
            <div className={cn("grid grid-cols-[36px_1fr_40px_40px]", rowClass)}>
              <span className="text-sm font-bold text-center">{set.setNumber}</span>
              <Input
                type="number"
                value={set.reps || ""}
                onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
                placeholder="0"
                className={inputClass}
                disabled={!isCurrent}
                min={0}
              />
              <button
                onClick={() => updateSet(i, "isFailure", !set.isFailure)}
                disabled={!isCurrent}
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center mx-auto transition-colors",
                  set.isFailure ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground",
                  "disabled:opacity-40"
                )}
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              {checkButton}
            </div>
            {isAdvanced && isDone && (
              <div className="pl-9 mt-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">RPE:</span>
                  <RPESelector value={set.rpeActual} onChange={(rpe) => updateSet(i, "rpeActual", rpe)} disabled={false} />
                </div>
              </div>
            )}
          </div>
        );
      case "distance":
        return (
          <div key={i} className={cn("grid grid-cols-[36px_1fr_1fr_40px]", rowClass)}>
            <span className="text-sm font-bold text-center">{set.setNumber}</span>
            <Input
              type="number"
              value={set.reps || ""}
              onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
              placeholder="0"
              className={inputClass}
              disabled={!isCurrent}
              min={0}
            />
            <Input
              type="number"
              value={set.durationSeconds || ""}
              onChange={(e) => updateSet(i, "durationSeconds", Number(e.target.value))}
              placeholder="0"
              className={inputClass}
              disabled={!isCurrent}
              min={0}
            />
            {checkButton}
          </div>
        );
      default: // weight_reps
        return (
          <div key={i}>
            <div className={cn("grid grid-cols-[36px_1fr_1fr_40px_40px]", rowClass)}>
              <span className="text-sm font-bold text-center">{set.setNumber}</span>
              <div className="relative">
                <Input
                  type="number"
                  value={set.weight || ""}
                  onChange={(e) => updateSet(i, "weight", Number(e.target.value))}
                  placeholder="0"
                  className={inputClass}
                  disabled={!isCurrent}
                  min={0}
                  step={2.5}
                />
                {getPrevComparison(i, "weight") && isDone && (
                  <span className={cn(
                    "absolute -right-0.5 -top-0.5 text-[9px] font-bold",
                    getPrevComparison(i, "weight") === "up" && "text-success",
                    getPrevComparison(i, "weight") === "down" && "text-destructive",
                  )}>
                    {getPrevComparison(i, "weight") === "up" ? "↑" : getPrevComparison(i, "weight") === "down" ? "↓" : ""}
                  </span>
                )}
              </div>
              <Input
                type="number"
                value={set.reps || ""}
                onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
                placeholder="0"
                className={inputClass}
                disabled={!isCurrent}
                min={0}
              />
              <button
                onClick={() => updateSet(i, "isFailure", !set.isFailure)}
                disabled={!isCurrent}
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center mx-auto transition-colors",
                  set.isFailure ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground",
                  "disabled:opacity-40"
                )}
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              {checkButton}
            </div>
            {isAdvanced && isDone && (
              <div className="pl-9 mt-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">RPE:</span>
                  <RPESelector value={set.rpeActual} onChange={(rpe) => updateSet(i, "rpeActual", rpe)} disabled={false} />
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  if (isSkipped) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/30 opacity-50 p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <SkipForward className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate line-through">{name}</p>
          </div>
          <span className="bg-warning/10 text-warning px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0">
            {t('skip_badge', 'Passé')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isActive ? "bg-card border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "bg-card/50 border-border/50"
    )}>
      {/* Compact header */}
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            {trackingType === "duration" ? (
              <Timer className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            ) : trackingType === "distance" ? (
              <Route className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            ) : (
              <Dumbbell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm truncate">{name}</p>
              {isSubstituted && (
                <span className="bg-warning-bg text-warning px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0">
                  {t('modified')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {renderTags()}
              {isAdvanced && tempo && (
                <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                  {tempo}
                </span>
              )}
              {restSeconds > 0 && (
                <span className="bg-tag-blue-bg text-tag-blue px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                  {restSeconds >= 60 ? `${Math.floor(restSeconds / 60)}'${restSeconds % 60 > 0 ? (restSeconds % 60).toString().padStart(2, '0') + '"' : ''}` : `${restSeconds}s`}
                </span>
              )}
              {isAdvanced && rpeTarget && (
                <span className="bg-tag-orange-bg text-tag-orange px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                  RPE {rpeTarget}
                </span>
              )}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          {/* Coach instructions button in Simple mode when coach has set tempo/rpe */}
          {!isAdvanced && (tempo || rpeTarget) && (
            <CoachInstructionsButton tempo={tempo} rpe={rpeTarget} coachNotes={coachNotes} />
          )}
          {onSkipExercise && !allDone && isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); onSkipExercise?.(); }}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-warning hover:bg-warning/10 transition-colors"
              title={t('skip_btn', 'Passer')}
            >
              <SkipForward className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
          {onSwapExercise && !allDone && (
            <div className="flex items-center justify-center w-11 h-11">
              <button
                onClick={(e) => { e.stopPropagation(); onSwapExercise?.(); }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          )}
          {allDone && <Check className="w-5 h-5 text-success shrink-0" strokeWidth={1.5} />}
          <button onClick={() => setExpanded(!expanded)}>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform shrink-0",
              expanded && "rotate-180"
            )} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-4 border-t border-border pt-3">
          {/* Video embed section */}
          <ExerciseVideoEmbed exerciseName={name} />

          {(suggestedWeight || (isAdvanced && coachNotes)) && (
            <div className="space-y-2">
              {suggestedWeight && trackingType === "weight_reps" && (
                <p className="text-xs text-muted-foreground">
                  💪 <span className="font-medium">{t('target_weight')} :</span> {suggestedWeight} kg
                </p>
              )}
              {isAdvanced && coachNotes && (
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  📝 {coachNotes}
                </p>
              )}
            </div>
          )}

          {showTimer && isActive && (
            isAdvanced ? (
              <CircularRestTimer
                key={currentSetIdx}
                initialSeconds={restSeconds}
                onComplete={() => setShowTimer(false)}
              />
            ) : (
              <RestTimer
                key={currentSetIdx}
                initialSeconds={restSeconds}
                onComplete={() => setShowTimer(false)}
              />
            )
          )}

          {isActive && completedSets.length > 0 && (
            <div className="space-y-2">
              <div className="overflow-x-auto -mx-3 px-3">
                {renderSetHeader()}
                {completedSets.map((set, i) => renderSetRow(set, i))}
                {!allDone && (
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={addSet}>
                    <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                    {t('add_set')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedExerciseCard;
