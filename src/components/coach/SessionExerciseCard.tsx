import { SessionExerciseData } from "@/types/coach";
import { GripVertical, Trash2, ChevronUp, ChevronDown, Dumbbell, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SessionExerciseCardProps {
  item: SessionExerciseData;
  index: number;
  total: number;
  onUpdate: (updated: SessionExerciseData) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const SessionExerciseCard = ({ item, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }: SessionExerciseCardProps) => {
  const [showNotes, setShowNotes] = useState(!!item.coachNotes);

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Dumbbell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{item.exercise.name}</p>
          <p className="text-[11px] text-muted-foreground">{item.exercise.muscle_group} · {item.exercise.equipment}</p>
        </div>
        <button onClick={() => setShowNotes(!showNotes)} className="text-muted-foreground hover:text-primary transition-colors">
          <MessageSquare className="w-4 h-4" />
        </button>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Params grid */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Séries</label>
          <Input
            type="number"
            value={item.sets}
            onChange={(e) => onUpdate({ ...item, sets: Number(e.target.value) || 1 })}
            className="h-9 text-center bg-surface text-sm font-semibold"
            min={1}
            max={20}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Reps min</label>
          <Input
            type="number"
            value={item.repsMin}
            onChange={(e) => onUpdate({ ...item, repsMin: Number(e.target.value) || 1 })}
            className="h-9 text-center bg-surface text-sm font-semibold"
            min={1}
            max={100}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Reps max</label>
          <Input
            type="number"
            value={item.repsMax}
            onChange={(e) => onUpdate({ ...item, repsMax: Number(e.target.value) || 1 })}
            className="h-9 text-center bg-surface text-sm font-semibold"
            min={1}
            max={100}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Repos (s)</label>
          <Input
            type="number"
            value={item.restSeconds}
            onChange={(e) => onUpdate({ ...item, restSeconds: Number(e.target.value) || 30 })}
            className="h-9 text-center bg-surface text-sm font-semibold"
            min={0}
            step={15}
          />
        </div>
      </div>

      {/* Optional weight */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Charge suggérée (kg)</label>
          <Input
            type="number"
            value={item.suggestedWeight ?? ""}
            onChange={(e) => onUpdate({ ...item, suggestedWeight: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="h-9 bg-surface text-sm"
            min={0}
            step={2.5}
          />
        </div>
      </div>

      {/* Notes */}
      {showNotes && (
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Notes du coach</label>
          <Input
            value={item.coachNotes ?? ""}
            onChange={(e) => onUpdate({ ...item, coachNotes: e.target.value || undefined })}
            placeholder="Ex: Contrôler la descente, 2s négatif..."
            className="h-9 bg-surface text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default SessionExerciseCard;
