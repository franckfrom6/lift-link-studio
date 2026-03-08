import { useState } from "react";
import { ChevronDown, Dumbbell, X, Check, Plus, ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CircularRestTimer from "./CircularRestTimer";
import VideoLink from "./VideoLink";
import RPESelector from "./RPESelector";
import { useTranslation } from "react-i18next";

export interface EnhancedCompletedSet {
  setNumber: number;
  weight: number;
  reps: number;
  isFailure: boolean;
  rpeActual: number | null;
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
  hasAlternatives?: boolean;
  isSubstituted?: boolean;
  previousSets?: { weight: number; reps: number }[];
}

const EnhancedExerciseCard = ({
  name, sets: targetSets, repsMin, repsMax, restSeconds,
  tempo, rpeTarget, suggestedWeight, coachNotes,
  videoUrl, videoSearchQuery,
  isActive, completedSets, onCompletedSetsChange, onAllSetsComplete,
  onSwapExercise, hasAlternatives, isSubstituted,
  previousSets,
}: EnhancedExerciseCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation('exercises');
  const [currentSetIdx, setCurrentSetIdx] = useState(
    completedSets.findIndex(s => s.reps === 0) >= 0
      ? completedSets.findIndex(s => s.reps === 0)
      : completedSets.length < targetSets ? completedSets.length : -1
  );
  const [showTimer, setShowTimer] = useState(false);
  const [allDone, setAllDone] = useState(completedSets.length >= targetSets && completedSets.every(s => s.reps > 0));

  if (completedSets.length === 0 && isActive) {
    const initial: EnhancedCompletedSet[] = Array.from({ length: targetSets }, (_, i) => ({
      setNumber: i + 1,
      weight: suggestedWeight || 0,
      reps: 0,
      isFailure: false,
      rpeActual: null,
    }));
    onCompletedSetsChange(initial);
    return null;
  }

  const updateSet = (idx: number, field: keyof EnhancedCompletedSet, value: any) => {
    const updated = [...completedSets];
    updated[idx] = { ...updated[idx], [field]: value };
    onCompletedSetsChange(updated);
  };

  const validateSet = (idx: number) => {
    if (idx < completedSets.length - 1) {
      setCurrentSetIdx(idx + 1);
      const updated = [...completedSets];
      if (updated[idx + 1] && updated[idx + 1].weight === 0) {
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
      { setNumber: completedSets.length + 1, weight: lastWeight, reps: 0, isFailure: false, rpeActual: null }
    ]);
    if (allDone) {
      setAllDone(false);
      setCurrentSetIdx(completedSets.length);
    }
  };

  const getPrevComparison = (idx: number, field: "weight" | "reps") => {
    if (!previousSets || !previousSets[idx]) return null;
    const current = completedSets[idx]?.[field] || 0;
    const prev = previousSets[idx][field];
    if (current === 0 || prev === 0) return null;
    if (current > prev) return "up";
    if (current < prev) return "down";
    return "same";
  };

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
            <Dumbbell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
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
              <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                {targetSets}s
              </span>
              <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                {repsMin === repsMax ? repsMin : `${repsMin}-${repsMax}`} reps
              </span>
              {tempo && (
                <span className="bg-tag-violet-bg text-tag-violet px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                  {tempo}
                </span>
              )}
              {restSeconds > 0 && (
                <span className="bg-tag-blue-bg text-tag-blue px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                  {restSeconds >= 60 ? `${Math.floor(restSeconds / 60)}'${restSeconds % 60 > 0 ? (restSeconds % 60).toString().padStart(2, '0') + '"' : ''}` : `${restSeconds}s`}
                </span>
              )}
              {rpeTarget && (
                <span className="bg-tag-orange-bg text-tag-orange px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                  RPE {rpeTarget}
                </span>
              )}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          {hasAlternatives && !allDone && (
            <button
              onClick={(e) => { e.stopPropagation(); onSwapExercise?.(); }}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
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
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {(suggestedWeight || coachNotes || videoUrl || videoSearchQuery) && (
            <div className="space-y-2">
              {suggestedWeight && (
                <p className="text-xs text-muted-foreground">
                  💪 <span className="font-medium">{t('target_weight')} :</span> {suggestedWeight} kg
                </p>
              )}
              {coachNotes && (
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  📝 {coachNotes}
                </p>
              )}
              <VideoLink
                videoUrl={videoUrl}
                videoSearchQuery={videoSearchQuery}
                exerciseName={name}
              />
            </div>
          )}

          {showTimer && isActive && (
            <CircularRestTimer
              key={currentSetIdx}
              initialSeconds={restSeconds}
              onComplete={() => setShowTimer(false)}
            />
          )}

          {isActive && completedSets.length > 0 && (
            <div className="space-y-2">
              <div className="overflow-x-auto -mx-3 px-3">
              <div className="grid grid-cols-[36px_1fr_1fr_40px_40px] gap-1.5 min-w-[280px] text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
                <span>Set</span>
                <span>Kg</span>
                <span>Reps</span>
                <span className="text-center">Fail</span>
                <span></span>
              </div>

              {completedSets.map((set, i) => {
                const weightTrend = getPrevComparison(i, "weight");
                const isCurrent = i === currentSetIdx && !allDone;
                const isDone = i < currentSetIdx || allDone;

                return (
                  <div key={i}>
                    <div className={cn(
                      "grid grid-cols-[36px_1fr_1fr_40px_40px] gap-1.5 items-center p-1.5 rounded-lg transition-colors",
                      isCurrent && "bg-accent ring-1 ring-accent-foreground/20",
                      isDone && "opacity-60"
                    )}>
                      <span className="text-sm font-bold text-center">{set.setNumber}</span>
                      <div className="relative">
                        <Input
                          type="number"
                          value={set.weight || ""}
                          onChange={(e) => updateSet(i, "weight", Number(e.target.value))}
                          placeholder="0"
                          className="h-9 text-center bg-background text-sm font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          disabled={!isCurrent}
                          min={0}
                          step={2.5}
                        />
                        {weightTrend && isDone && (
                          <span className={cn(
                            "absolute -right-0.5 -top-0.5 text-[9px] font-bold",
                            weightTrend === "up" && "text-success",
                            weightTrend === "down" && "text-destructive",
                          )}>
                            {weightTrend === "up" ? "↑" : weightTrend === "down" ? "↓" : ""}
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        value={set.reps || ""}
                        onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
                        placeholder="0"
                        className="h-9 text-center bg-background text-sm font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      {isCurrent ? (
                        <Button size="icon" className="h-9 w-9" onClick={() => validateSet(i)} disabled={!set.reps}>
                          <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </Button>
                      ) : (
                        <div className="h-9 w-9 flex items-center justify-center">
                          {isDone && <Check className="w-3.5 h-3.5 text-success" strokeWidth={1.5} />}
                        </div>
                      )}
                    </div>

                    {isDone && (
                      <div className="pl-9 mt-1 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-medium">RPE:</span>
                          <RPESelector
                            value={set.rpeActual}
                            onChange={(rpe) => updateSet(i, "rpeActual", rpe)}
                            disabled={false}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!allDone && (
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={addSet}>
                  <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                  {t('add_set')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedExerciseCard;
