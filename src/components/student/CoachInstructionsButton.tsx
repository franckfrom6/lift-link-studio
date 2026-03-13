import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface CoachInstructionsButtonProps {
  tempo?: string | null;
  rpe?: string | null;
  coachNotes?: string | null;
}

const CoachInstructionsButton = ({ tempo, rpe, coachNotes }: CoachInstructionsButtonProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation(["session", "exercises"]);

  if (!tempo && !rpe && !coachNotes) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <ClipboardList className="w-3.5 h-3.5" strokeWidth={1.5} />
        {t("session:coach_instructions")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{t("session:coach_instructions")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {tempo && (
              <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-xs text-muted-foreground font-medium">{t("exercises:tempo")}</span>
                <span className="text-sm font-bold">{tempo}</span>
              </div>
            )}
            {rpe && (
              <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-xs text-muted-foreground font-medium">RPE</span>
                <span className="text-sm font-bold">{rpe}</span>
              </div>
            )}
            {coachNotes && (
              <div className="bg-secondary/50 rounded-lg px-3 py-2 space-y-1">
                <span className="text-xs text-muted-foreground font-medium">{t("exercises:coach_notes")}</span>
                <p className="text-sm leading-relaxed">{coachNotes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoachInstructionsButton;
