import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dumbbell, Activity, Zap, ChevronRight } from "lucide-react";

interface SessionTypeChooserProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  onChooseStrength: (date: Date) => void;
  onChooseRun: (date: Date) => void;
  onChooseHybrid: (date: Date) => void;
}

const SessionTypeChooser = ({
  open,
  onClose,
  date,
  onChooseStrength,
  onChooseRun,
  onChooseHybrid,
}: SessionTypeChooserProps) => {
  const pick = (kind: "strength" | "run" | "hybrid") => {
    onClose();
    if (kind === "strength") onChooseStrength(date);
    else if (kind === "run") onChooseRun(date);
    else onChooseHybrid(date);
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-6">
        <SheetHeader>
          <SheetTitle className="text-base">Quelle séance ajouter ?</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 mt-4">
          <button
            type="button"
            onClick={() => pick("strength")}
            className="flex items-center gap-4 rounded-xl border border-border p-4 text-left hover:border-primary hover:bg-accent active:scale-[0.98] transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Dumbbell className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Musculation</p>
              <p className="text-xs text-muted-foreground">Séries, répétitions, charges</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => pick("run")}
            className="flex items-center gap-4 rounded-xl border border-border p-4 text-left hover:border-primary hover:bg-accent active:scale-[0.98] transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Activity className="h-5 w-5 text-blue-500" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Course à pied</p>
              <p className="text-xs text-muted-foreground">Blocs d'allure et de distance</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => pick("hybrid")}
            className="flex items-center gap-4 rounded-xl border border-border p-4 text-left hover:border-primary hover:bg-accent active:scale-[0.98] transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Zap className="h-5 w-5 text-orange-500" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Hybride</p>
              <p className="text-xs text-muted-foreground">Mix cardio + musculation</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SessionTypeChooser;