import { useState } from "react";
import { Exercise, MUSCLE_GROUPS } from "@/types/coach";
import { useExercises } from "@/hooks/useExercises";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Dumbbell, Plus, Loader2 } from "lucide-react";

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

  const filtered = exercises
    .filter((ex) => !excludeIds.includes(ex.id))
    .filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = !selectedMuscle || ex.muscle_group === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Ajouter un exercice</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
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
              !selectedMuscle ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
            }`}
          >
            Tous
          </button>
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg}
              onClick={() => setSelectedMuscle(mg === selectedMuscle ? null : mg)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedMuscle === mg ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
              }`}
            >
              {mg}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Aucun exercice trouvé</p>
          ) : (
            filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  onSelect(ex);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ex.muscle_group}{ex.secondary_muscle ? ` · ${ex.secondary_muscle}` : ""} · {ex.equipment}
                  </p>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExercisePicker;
