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
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation(['calendar', 'common']);
  const [reason, setReason] = useState("");

  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const getDayName = (idx: number) => t(`common:days.${dayKeys[idx]}`);

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
            {isMutualSwap ? t('calendar:swap_sessions') : t('calendar:move_session')}
          </DialogTitle>
          <DialogDescription>
            {isMutualSwap
              ? t('calendar:swap_confirm', { session1: sessionName, session2: targetSessionName })
              : t('calendar:move_confirm', { session: sessionName })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{getDayName(fromDayIndex)}</div>
            <div className="text-sm font-semibold">{fromDate.getDate()}/{fromDate.getMonth() + 1}</div>
            <div className="text-xs font-medium text-foreground mt-0.5">{sessionName}</div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{getDayName(toDayIndex)}</div>
            <div className="text-sm font-semibold">{toDate.getDate()}/{toDate.getMonth() + 1}</div>
            {isMutualSwap && targetSessionName && (
              <div className="text-xs font-medium text-foreground mt-0.5">{targetSessionName}</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t('calendar:reason_optional')}
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('calendar:reason_placeholder')}
            className="h-20 text-sm resize-none"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>{t('common:cancel')}</Button>
          <Button onClick={handleConfirm}>
            {isMutualSwap ? t('calendar:swap') : t('calendar:move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionSwapModal;