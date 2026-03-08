import { cn } from "@/lib/utils";
import { CheckinData } from "./WeeklyCheckinForm";
import { useTranslation } from "react-i18next";

interface CheckinBadgeProps {
  checkin: CheckinData | null;
  onClick?: () => void;
}

const getStatusColor = (checkin: CheckinData) => {
  const { energy_level, stress_level, muscle_soreness } = checkin;
  if (energy_level === 1 || stress_level === 5 || muscle_soreness === 5) return "destructive";
  if (energy_level <= 3 || stress_level >= 3 || muscle_soreness >= 3) return "warning";
  return "success";
};

const ENERGY_EMOJIS = ["😴", "😪", "😐", "🔋", "⚡"];
const SLEEP_EMOJIS = ["😵", "😣", "😐", "😊", "😴"];
const STRESS_EMOJIS = ["😌", "😐", "😰", "😫", "🤯"];
const SORENESS_EMOJIS = ["💪", "😐", "😣", "😖", "🦽"];

const CheckinBadge = ({ checkin, onClick }: CheckinBadgeProps) => {
  const { t } = useTranslation(['recovery', 'checkin']);

  if (!checkin) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-warning/40 bg-warning-bg/50 text-warning text-[11px] font-medium hover:bg-warning-bg transition-colors"
      >
        📋 {t('recovery:week_checkin')}
      </button>
    );
  }

  const status = getStatusColor(checkin);
  const borderColor = {
    success: "border-success/30 bg-success-bg/50",
    warning: "border-warning/30 bg-warning-bg/50",
    destructive: "border-destructive/30 bg-destructive/10",
  }[status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors hover:opacity-80",
        borderColor
      )}
    >
      <div className="flex items-center gap-1.5 text-sm">
        <span title={t('checkin:energy')}>{ENERGY_EMOJIS[checkin.energy_level - 1]}</span>
        <span title={t('checkin:sleep')}>{SLEEP_EMOJIS[checkin.sleep_quality - 1]}</span>
        <span title={t('checkin:stress')}>{STRESS_EMOJIS[checkin.stress_level - 1]}</span>
        <span title={t('checkin:soreness')}>{SORENESS_EMOJIS[checkin.muscle_soreness - 1]}</span>
      </div>
      <span className="text-[10px] text-muted-foreground flex-1 text-left truncate">
        {checkin.general_notes || checkin.availability_notes || t('recovery:checkin_sent')}
      </span>
    </button>
  );
};

export default CheckinBadge;