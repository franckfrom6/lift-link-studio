import { useState } from "react";
import { Exercise, MUSCLE_GROUPS } from "@/types/coach";
import { useExercises } from "@/hooks/useExercises";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Dumbbell, Plus, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getExerciseName, getMuscleGroupLabel, getEquipmentLabel } from "@/lib/exercise-utils";

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  excludeIds?: string[];
}

const ExercisePicker = ({ open, onClose, onSelect, excludeIds = [] }: ExercisePickerProps) => {
  const { exercises, loading } = useExercises();
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const { t } = useTranslation('exercises');

  const filtered = exercises
    .filter((ex) => !excludeIds.includes(ex.id))
    .filter((ex) => {
      const name = getExerciseName(ex);
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = !selectedMuscle || ex.muscle_group === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('common:add')} {t('exercise_library').toLowerCase()}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            placeholder={t('search_exercise')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-surface"
            autoFocus
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedMuscle(null)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              !selectedMuscle ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {t('all')}
          </button>
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg}
              onClick={() => setSelectedMuscle(mg === selectedMuscle ? null : mg)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedMuscle === mg ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {getMuscleGroupLabel(mg)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">{t('no_exercise_found')}</p>
          ) : (
            filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  onSelect(ex);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{getExerciseName(ex)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {getMuscleGroupLabel(ex.muscle_group)}{ex.secondary_muscle ? ` · ${getMuscleGroupLabel(ex.secondary_muscle)}` : ""} · {getEquipmentLabel(ex.equipment)}
                  </p>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExercisePicker;
