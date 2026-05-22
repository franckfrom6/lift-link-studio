import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface SessionTypeChooserProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  onChooseStrength: (date: Date) => void;
  onChooseRun: (date: Date) => void;
}

const SessionTypeChooser = ({
  open,
  onClose,
  date,
  onChooseStrength,
  onChooseRun,
}: SessionTypeChooserProps) => {
  const pick = (kind: "strength" | "run") => {
    onClose();
    if (kind === "strength") onChooseStrength(date);
    else onChooseRun(date);
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-6">
        <SheetHeader>
          <SheetTitle className="text-base">Quelle séance ajouter ?</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            type="button"
            onClick={() => pick("strength")}
            className="h-28 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition-all flex flex-col items-center justify-center gap-1"
          >
            <span className="text-3xl" aria-hidden>💪</span>
            <span className="font-semibold text-sm">Musculation</span>
            <span className="text-xs text-muted-foreground">Exercices · Séries · Reps</span>
          </button>

          <button
            type="button"
            onClick={() => pick("run")}
            className="h-28 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition-all flex flex-col items-center justify-center gap-1"
          >
            <span className="text-3xl" aria-hidden>🏃</span>
            <span className="font-semibold text-sm">Course à pied</span>
            <span className="text-xs text-muted-foreground">Blocs · Allure · Zones</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SessionTypeChooser;