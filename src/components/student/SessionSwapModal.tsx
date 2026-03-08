import { useState } from "react";
import { ArrowRight, ArrowLeftRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const DAY_NAMES: Record<number, string> = {
  0: "Lundi", 1: "Mardi", 2: "Mercredi", 3: "Jeudi", 4: "Vendredi", 5: "Samedi", 6: "Dimanche",
};

interface SessionSwapModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  sessionName: string;
  fromDayIndex: number;
  toDayIndex: number;
  fromDate: Date;
  toDate: Date;
  isMutualSwap: boolean;
  targetSessionName?: string;
}

const SessionSwapModal = ({
  open, onClose, onConfirm,
  sessionName, fromDayIndex, toDayIndex, fromDate, toDate,
  isMutualSwap, targetSessionName,
}: SessionSwapModalProps) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            {isMutualSwap ? "Échanger les séances" : "Déplacer la séance"}
          </DialogTitle>
          <DialogDescription>
            {isMutualSwap
              ? `Échanger "${sessionName}" et "${targetSessionName}" ?`
              : `Déplacer "${sessionName}" vers un autre jour ?`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{DAY_NAMES[fromDayIndex]}</div>
            <div className="text-sm font-semibold">{fromDate.getDate()}/{fromDate.getMonth() + 1}</div>
            <div className="text-xs font-medium text-foreground mt-0.5">{sessionName}</div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{DAY_NAMES[toDayIndex]}</div>
            <div className="text-sm font-semibold">{toDate.getDate()}/{toDate.getMonth() + 1}</div>
            {isMutualSwap && targetSessionName && (
              <div className="text-xs font-medium text-foreground mt-0.5">{targetSessionName}</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
            Raison (optionnel)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex : Réunion client toute la journée"
            className="h-20 text-sm resize-none"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleConfirm}>
            {isMutualSwap ? "Échanger" : "Déplacer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionSwapModal;
