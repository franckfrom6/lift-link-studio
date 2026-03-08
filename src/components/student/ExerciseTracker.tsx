import { ProgramExerciseDetail } from "@/data/yana-program";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Plus, Play, MessageSquare, Dumbbell } from "lucide-react";
import RestTimer from "./RestTimer";

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
          <span>sur {total}</span>
        </div>
        <h2 className="text-xl font-display font-bold leading-tight">{exercise.name}</h2>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {exercise.sets && (
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-[11px] font-medium">
              {exercise.sets} séries
            </span>
          )}
          {exercise.reps && (
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-[11px] font-medium">
              {exercise.reps} reps
            </span>
          )}
          {exercise.tempo && (
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-[11px] font-medium">
              Tempo {exercise.tempo}
            </span>
          )}
          {exercise.rpe && (
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[11px] font-medium">
              RPE {exercise.rpe}
            </span>
          )}
        </div>
      </div>

      {/* Coach notes */}
      {exercise.notes && (
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-start gap-2 text-left"
        >
          <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className={`text-sm text-muted-foreground ${showNotes ? "" : "line-clamp-2"}`}>
            {exercise.notes}
          </p>
        </button>
      )}

      {/* Video link */}
      {exercise.video && (
        <a
          href={exercise.video}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
        >
          <Play className="w-3 h-3" />
          Voir la démo — {exercise.channel}
        </a>
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
          <span>Poids (kg)</span>
          <span>Reps</span>
          <span className="text-center">Fail</span>
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
            />
            <Input
              type="number"
              value={set.reps || ""}
              onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
              placeholder="0"
              className="h-10 text-center bg-background text-base font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={i !== currentSet || done}
              min={0}
            />
            <button
              onClick={() => updateSet(i, "isFailure", !set.isFailure)}
              disabled={i !== currentSet || done}
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
              >
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <div className="h-10 w-10 flex items-center justify-center">
                {(i < currentSet || done) && <Check className="w-4 h-4 text-primary" />}
              </div>
            )}
          </div>
        ))}

        {!done && (
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={addSet}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Ajouter une série
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onPrev} disabled={isFirst}>
          Précédent
        </Button>
        <Button className="flex-1" onClick={onNext} disabled={!done && !isLast}>
          {isLast && done ? "Terminer" : "Suivant"}
        </Button>
      </div>
    </div>
  );
};

export default ExerciseTracker;
