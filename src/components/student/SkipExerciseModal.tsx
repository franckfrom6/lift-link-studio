import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { SkipForward } from "lucide-react";

const SKIP_REASONS = ["machine_unavailable", "pain", "no_time", "other"] as const;
type SkipReason = typeof SKIP_REASONS[number];

interface SkipExerciseModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: SkipReason | null, reasonDetail: string | null) => void;
  exerciseName: string;
}

const SkipExerciseModal = ({ open, onClose, onConfirm, exerciseName }: SkipExerciseModalProps) => {
  const { t } = useTranslation("session");
  const [selectedReason, setSelectedReason] = useState<SkipReason | null>(null);
  const [otherDetail, setOtherDetail] = useState("");

  const handleConfirm = () => {
    onConfirm(
      selectedReason,
      selectedReason === "other" ? otherDetail || null : null
    );
    setSelectedReason(null);
    setOtherDetail("");
  };

  const handleClose = () => {
    setSelectedReason(null);
    setOtherDetail("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <SkipForward className="w-4 h-4" strokeWidth={1.5} />
            {t("skip_title")}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t("skip_confirm_text", { exercise: exerciseName })}
        </p>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("skip_reason_label")}
          </Label>
          {SKIP_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors",
                selectedReason === reason
                  ? "border-primary bg-primary/5 text-foreground font-medium"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary"
              )}
            >
              {t(`skip_reason_${reason}`)}
            </button>
          ))}

          {selectedReason === "other" && (
            <Input
              placeholder={t("skip_other_placeholder")}
              value={otherDetail}
              onChange={(e) => setOtherDetail(e.target.value)}
              className="mt-2"
              autoFocus
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            {t("skip_cancel")}
          </Button>
          <Button onClick={handleConfirm}>
            {t("skip_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SkipExerciseModal;
