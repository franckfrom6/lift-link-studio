import { SessionExerciseData } from "@/types/coach";
import { Trash2, ChevronUp, ChevronDown, Dumbbell, MessageSquare, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getExerciseName, getMuscleGroupLabel, getEquipmentLabel } from "@/lib/exercise-utils";

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
  const [showExtras, setShowExtras] = useState(false);

  return (
    <div className="glass p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Dumbbell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{item.exercise.name}</p>
          <p className="text-[11px] text-muted-foreground">{item.exercise.muscle_group} · {item.exercise.equipment}</p>
        </div>
        <button onClick={() => setShowExtras(!showExtras)} className="text-muted-foreground hover:text-foreground transition-colors" title="Plus d'options">
          <Film className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button onClick={() => setShowExtras(!showExtras)} className="text-muted-foreground hover:text-foreground transition-colors">
          <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Core params grid */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">Séries</label>
          <Input
            type="number"
            value={item.sets}
            onChange={(e) => onUpdate({ ...item, sets: Number(e.target.value) || 1 })}
            className="h-9 text-center bg-surface text-sm font-semibold"
            min={1} max={20}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">Reps min</label>
          <Input
            type="number"
            value={item.repsMin}
            onChange={(e) => onUpdate({ ...item, repsMin: Number(e.target.value) || 1 })}
            className="h-9 text-center bg-surface text-sm font-semibold"
            min={1} max={100}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">Reps max</label>
          <Input
            type="number"
            value={item.repsMax}
            onChange={(e) => onUpdate({ ...item, repsMax: Number(e.target.value) || 1 })}
            className="h-9 text-center bg-surface text-sm font-semibold"
            min={1} max={100}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">Repos (s)</label>
          <Input
            type="number"
            value={item.restSeconds}
            onChange={(e) => onUpdate({ ...item, restSeconds: Number(e.target.value) || 30 })}
            className="h-9 text-center bg-surface text-sm font-semibold"
            min={0} step={15}
          />
        </div>
      </div>

      {/* Extended params */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">Charge (kg)</label>
          <Input
            type="number"
            value={item.suggestedWeight ?? ""}
            onChange={(e) => onUpdate({ ...item, suggestedWeight: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="h-9 bg-surface text-sm"
            min={0} step={2.5}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">Tempo</label>
          <Input
            value={item.tempo ?? ""}
            onChange={(e) => onUpdate({ ...item, tempo: e.target.value || undefined })}
            placeholder="2-0-1-2"
            className="h-9 bg-surface text-sm text-center"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">RPE cible</label>
          <Input
            value={item.rpeTarget ?? ""}
            onChange={(e) => onUpdate({ ...item, rpeTarget: e.target.value || undefined })}
            placeholder="8-9"
            className="h-9 bg-surface text-sm text-center"
          />
        </div>
      </div>

      {/* Extras */}
      {showExtras && (
        <div className="space-y-2 pt-1 border-t border-border pt-3">
          <div>
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">Notes du coach</label>
            <Input
              value={item.coachNotes ?? ""}
              onChange={(e) => onUpdate({ ...item, coachNotes: e.target.value || undefined })}
              placeholder="Ex: Contrôler la descente, 2s négatif..."
              className="h-9 bg-surface text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">URL Vidéo</label>
            <Input
              value={item.videoUrl ?? ""}
              onChange={(e) => onUpdate({ ...item, videoUrl: e.target.value || undefined })}
              placeholder="https://youtube.com/watch?v=..."
              className="h-9 bg-surface text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">Recherche YouTube (fallback)</label>
            <Input
              value={item.videoSearchQuery ?? ""}
              onChange={(e) => onUpdate({ ...item, videoSearchQuery: e.target.value || undefined })}
              placeholder="hip thrust barbell form"
              className="h-9 bg-surface text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionExerciseCard;
