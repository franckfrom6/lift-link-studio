import { cn } from "@/lib/utils";
import { CheckinData } from "../student/WeeklyCheckinForm";
import { useTranslation } from "react-i18next";

interface CoachCheckinSummaryProps {
  studentName: string;
  avatar: string;
  checkin: CheckinData | null;
  onClick?: () => void;
}

const ENERGY_EMOJIS = ["😴", "😪", "😐", "🔋", "⚡"];
const SLEEP_EMOJIS = ["😵", "😣", "😐", "😊", "😴"];
const STRESS_EMOJIS = ["😌", "😐", "😰", "😫", "🤯"];
const SORENESS_EMOJIS = ["💪", "😐", "😣", "😖", "🦽"];

const getStatus = (checkin: CheckinData) => {
  const { energy_level, stress_level, muscle_soreness } = checkin;
  if (energy_level === 1 || stress_level === 5 || muscle_soreness === 5) return "red";
  if (energy_level <= 3 || stress_level >= 3 || muscle_soreness >= 3) return "orange";
  return "green";
};

const statusColors = {
  green: "border-success/30 bg-success-bg/50",
  orange: "border-warning/30 bg-warning-bg/50",
  red: "border-destructive/30 bg-destructive/10",
};

const CoachCheckinSummary = ({ studentName, avatar, checkin, onClick }: CoachCheckinSummaryProps) => {
  const { t } = useTranslation('recovery');

  if (!checkin) {
    return (
      <button onClick={onClick} className="glass p-3 flex items-center gap-3 w-full text-left hover:shadow-sm transition-all">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">{avatar}</div>
        <span className="text-sm font-medium flex-1">{studentName}</span>
        <span className="text-[10px] text-warning font-medium">⚠️ {t('no_checkin')}</span>
      </button>
    );
  }

  const status = getStatus(checkin);

  return (
    <button onClick={onClick} className={cn("w-full p-3 rounded-xl border flex items-center gap-3 text-left hover:opacity-80 transition-all", statusColors[status])}>
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">{avatar}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{studentName}</p>
        {checkin.general_notes && <p className="text-[10px] text-muted-foreground truncate">{checkin.general_notes}</p>}
      </div>
      <div className="flex items-center gap-1 text-sm">
        <span>{ENERGY_EMOJIS[checkin.energy_level - 1]}</span>
        <span>{SLEEP_EMOJIS[checkin.sleep_quality - 1]}</span>
        <span>{STRESS_EMOJIS[checkin.stress_level - 1]}</span>
        <span>{SORENESS_EMOJIS[checkin.muscle_soreness - 1]}</span>
      </div>
    </button>
  );
};

export default CoachCheckinSummary;