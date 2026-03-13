import { ProgramExerciseDetail } from "@/data/yana-program";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Plus, MessageSquare } from "lucide-react";
import RestTimer from "./RestTimer";
import { ExerciseVideoEmbed } from "./ExerciseVideoEmbed";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";

export interface CompletedSet {
  setNumber: number;
  weight: number;
  reps: number;
  isFailure: boolean;
}

interface ExerciseTrackerProps {
  exercise: ProgramExerciseDetail;
  index: number;
  total: number;
  onComplete: (sets: CompletedSet[]) => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const parseTargetSets = (setsStr: string): number => {
  const n = parseInt(setsStr);
  return isNaN(n) ? 1 : n;
};

const parseRestSeconds = (restStr: string): number => {
  if (!restStr || restStr === "—") return 60;
  const match = restStr.match(/(\d+)/);
  if (!match) return 60;
  const num = parseInt(match[1]);
  if (restStr.includes("'") || restStr.includes("min")) return num * 60;
  return num;
};

const ExerciseTracker = ({ exercise, index, total, onComplete, onPrev, onNext, isFirst, isLast }: ExerciseTrackerProps) => {
  const { t } = useTranslation(["exercises", "session", "common"]);
  const isAdvanced = useIsAdvanced();
  const targetSets = parseTargetSets(exercise.sets);
  const restSeconds = parseRestSeconds(exercise.rest);

  const [sets, setSets] = useState<CompletedSet[]>(
    Array.from({ length: targetSets }, (_, i) => ({
      setNumber: i + 1,
      weight: 0,
      reps: 0,
      isFailure: false,
    }))
  );
  const [currentSet, setCurrentSet] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [done, setDone] = useState(false);

  const updateSet = (idx: number, field: keyof CompletedSet, value: any) => {
    const updated = [...sets];
    updated[idx] = { ...updated[idx], [field]: value };
    setSets(updated);
  };

  const validateSet = (idx: number) => {
    if (idx < sets.length - 1) {
      setCurrentSet(idx + 1);
      setShowTimer(true);
    } else {
      setDone(true);
      onComplete(sets);
    }
  };

  const addSet = () => {
    setSets([...sets, { setNumber: sets.length + 1, weight: sets[sets.length - 1]?.weight || 0, reps: 0, isFailure: false }]);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Exercise header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold">
            {index + 1}
          </span>
          <span>{index + 1} / {total}</span>
        </div>
        <h2 className="text-xl font-display font-bold leading-tight">{exercise.name}</h2>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {exercise.sets && (
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-[11px] font-medium">
              {exercise.sets} {t("session:sets_unit")}
            </span>
          )}
          {exercise.reps && (
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-[11px] font-medium">
              {exercise.reps} {t("session:reps_unit")}
            </span>
          )}
          {exercise.tempo && (
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-[11px] font-medium">
              {t("exercises:tempo")} {exercise.tempo}
            </span>
          )}
          {exercise.rpe && (
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[11px] font-medium">
              RPE {exercise.rpe}
            </span>
          )}
        </div>
      </div>

      {/* Video embed */}
      <ExerciseVideoEmbed exerciseName={exercise.name} />

      {/* Coach notes */}
      {exercise.notes && (
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-start gap-2 text-left"
          aria-label={t("exercises:coach_notes")}
        >
          <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className={`text-sm text-muted-foreground ${showNotes ? "" : "line-clamp-2"}`}>
            {exercise.notes}
          </p>
        </button>
      )}

      {/* Rest timer */}
      {showTimer && (
        <RestTimer
          key={currentSet}
          initialSeconds={restSeconds}
          onComplete={() => setShowTimer(false)}
        />
      )}

      {/* Sets */}
      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_1fr_44px_44px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
          <span>Set</span>
          <span>{t("exercises:weight_kg")}</span>
          <span>{t("session:reps")}</span>
          <span className="text-center">{t("session:failure")}</span>
          <span></span>
        </div>

        {sets.map((set, i) => (
          <div
            key={i}
            className={`grid grid-cols-[40px_1fr_1fr_44px_44px] gap-2 items-center p-2 rounded-lg transition-colors ${
              i === currentSet && !done ? "bg-primary/10 ring-1 ring-primary/30" : i < currentSet || done ? "bg-surface/50 opacity-60" : "bg-surface/30"
            }`}
          >
            <span className="text-sm font-bold text-center">{set.setNumber}</span>
            <Input
              type="number"
              value={set.weight || ""}
              onChange={(e) => updateSet(i, "weight", Number(e.target.value))}
              placeholder="0"
              className="h-10 text-center bg-background text-base font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={i !== currentSet || done}
              min={0}
              step={2.5}
              aria-label={`${t("exercises:weight_kg")} — Set ${set.setNumber}`}
            />
            <Input
              type="number"
              value={set.reps || ""}
              onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
              placeholder="0"
              className="h-10 text-center bg-background text-base font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={i !== currentSet || done}
              min={0}
              aria-label={`${t("session:reps")} — Set ${set.setNumber}`}
            />
            <button
              onClick={() => updateSet(i, "isFailure", !set.isFailure)}
              disabled={i !== currentSet || done}
              aria-label={`${t("session:failure")} — Set ${set.setNumber}`}
              aria-pressed={set.isFailure}
              className={`h-10 w-10 rounded-lg flex items-center justify-center mx-auto transition-colors ${
                set.isFailure ? "bg-destructive/20 text-destructive" : "bg-surface text-muted-foreground"
              } disabled:opacity-40`}
            >
              <X className="w-4 h-4" />
            </button>
            {i === currentSet && !done ? (
              <Button
                size="icon"
                className="h-10 w-10"
                onClick={() => validateSet(i)}
                disabled={!set.reps}
                aria-label={`${t("common:confirm")} Set ${set.setNumber}`}
              >
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <div className="h-10 w-10 flex items-center justify-center">
                {(i < currentSet || done) && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
              </div>
            )}
          </div>
        ))}

        {!done && (
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={addSet}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            {t("exercises:add_set")}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onPrev} disabled={isFirst}>
          {t("common:back")}
        </Button>
        <Button className="flex-1" onClick={onNext} disabled={!done && !isLast}>
          {isLast && done ? t("session:finish_save") : t("common:next")}
        </Button>
      </div>
    </div>
  );
};

export default ExerciseTracker;
