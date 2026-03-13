import { useState, useRef } from "react";
import { LiveExercise } from "@/types/session-builder";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { getExerciseName, getMuscleGroupLabel, getEquipmentLabel } from "@/lib/exercise-utils";
import { GripVertical, Plus, Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ExerciseEditSheet from "./ExerciseEditSheet";

interface LiveExerciseListProps {
  exercises: LiveExercise[];
  onChange: (exercises: LiveExercise[]) => void;
  onAddExercise: () => void;
  onSubstitute: (exerciseId: string) => void;
}

const LiveExerciseList = ({ exercises, onChange, onAddExercise, onSubstitute }: LiveExerciseListProps) => {
  const { t } = useTranslation(["session", "exercises"]);
  const isAdvanced = useIsAdvanced();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Swipe-to-delete state
  const touchStartX = useRef<Record<string, number>>({});
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const editingExercise = exercises.find(e => e.id === editingId) ?? null;

  const updateExercise = (updated: LiveExercise) => {
    onChange(exercises.map(e => e.id === updated.id ? updated : e));
  };

  const deleteExercise = (id: string) => {
    onChange(exercises.filter(e => e.id !== id).map((e, i) => ({ ...e, order: i })));
    setEditingId(null);
    setSwipedId(null);
  };

  const handleTouchStart = (id: string, clientX: number) => {
    touchStartX.current[id] = clientX;
  };

  const handleTouchEnd = (id: string, clientX: number) => {
    const startX = touchStartX.current[id] ?? clientX;
    const diff = startX - clientX;
    if (diff > 80) {
      setSwipedId(id);
    } else if (diff < -40) {
      setSwipedId(null);
    }
    delete touchStartX.current[id];
  };

  return (
    <div className="space-y-2">
      {exercises.map((ex, idx) => (
        <div
          key={ex.id}
          className="relative overflow-hidden rounded-lg"
        >
          {/* Delete background */}
          {swipedId === ex.id && (
            <button
              onClick={() => deleteExercise(ex.id)}
              className="absolute inset-y-0 right-0 w-20 bg-destructive flex items-center justify-center text-destructive-foreground text-xs font-semibold z-0"
            >
              {t("common:delete", "Suppr.")}
            </button>
          )}

          <div
            className={cn(
              "relative z-10 bg-card border border-border rounded-lg p-3 transition-transform cursor-pointer active:bg-accent/50",
              swipedId === ex.id && "-translate-x-20"
            )}
            onClick={() => setEditingId(ex.id)}
            onTouchStart={e => handleTouchStart(ex.id, e.touches[0].clientX)}
            onTouchEnd={e => handleTouchEnd(ex.id, e.changedTouches[0].clientX)}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {idx + 1}. {getExerciseName({ name: ex.name, name_en: ex.nameEn })}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">
                    {ex.sets}×{ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}-${ex.repsMax}`}
                  </span>
                  {ex.weightEnabled && ex.weightKg && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {ex.weightKg}kg
                    </Badge>
                  )}
                  {!ex.weightEnabled && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {t("session:builder_bodyweight")}
                    </Badge>
                  )}
                  {isAdvanced && ex.tempo && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {ex.tempo}
                    </Badge>
                  )}
                  {isAdvanced && ex.rpeTarget && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      RPE {ex.rpeTarget}
                    </Badge>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {ex.restSeconds}s
              </span>
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground text-xs gap-1.5"
        onClick={onAddExercise}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
        {t("session:builder_add_exercise")}
      </Button>

      <ExerciseEditSheet
        exercise={editingExercise}
        open={!!editingId}
        onClose={() => setEditingId(null)}
        onUpdate={updateExercise}
        onDelete={() => editingId && deleteExercise(editingId)}
        onSubstitute={() => {
          if (editingExercise) {
            setEditingId(null);
            onSubstitute(editingExercise.id);
          }
        }}
      />
    </div>
  );
};

export default LiveExerciseList;
