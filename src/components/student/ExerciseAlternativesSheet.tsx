import { ArrowLeftRight, Dumbbell, Star, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExerciseAlternative, AlternativeGroup } from "@/data/exercise-alternatives";

interface ExerciseAlternativesSheetProps {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  group: AlternativeGroup | null;
  onSelect: (alternative: ExerciseAlternative) => void;
}

const difficultyConfig = {
  easy: { label: "Facile", color: "bg-success/10 text-success" },
  medium: { label: "Moyen", color: "bg-warning-bg text-warning" },
  hard: { label: "Avancé", color: "bg-destructive/10 text-destructive" },
};

const ExerciseAlternativesSheet = ({
  open, onClose, exerciseName, group, onSelect,
}: ExerciseAlternativesSheetProps) => {
  if (!group) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[80vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            Remplacer l'exercice
          </div>
          <SheetTitle className="text-base">{exerciseName}</SheetTitle>
          <Badge variant="secondary" className="w-fit text-[10px]">
            {group.muscleGroup}
          </Badge>
        </SheetHeader>

        <div className="space-y-2 mt-4 overflow-y-auto max-h-[55vh] pb-4">
          {group.alternatives.map((alt, i) => {
            const diff = difficultyConfig[alt.difficulty];
            return (
              <button
                key={i}
                onClick={() => onSelect(alt)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Dumbbell className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{alt.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{alt.reason}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="bg-tag-blue-bg text-tag-blue px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                      {alt.equipment}
                    </span>
                    <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-medium", diff.color)}>
                      {diff.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border">
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExerciseAlternativesSheet;
