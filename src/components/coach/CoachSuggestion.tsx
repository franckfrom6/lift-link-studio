import { cn } from "@/lib/utils";
import { CheckinData } from "../student/WeeklyCheckinForm";
import { useTranslation } from "react-i18next";

interface CoachSuggestionProps {
  checkin: CheckinData;
}

const CoachSuggestion = ({ checkin }: CoachSuggestionProps) => {
  const { t } = useTranslation('recovery');
  const suggestions: string[] = [];

  if (checkin.energy_level <= 2 && checkin.muscle_soreness >= 3) {
    const hasLegs = checkin.soreness_location.some(l => l === "jambes");
    suggestions.push(hasLegs ? t('suggest_lower_body') : t('suggest_global_volume'));
  }

  if (checkin.energy_level <= 2) {
    suggestions.push(t('suggest_moderate_rpe'));
  }

  if (checkin.stress_level >= 4) {
    suggestions.push(t('suggest_high_stress'));
  }

  if (checkin.sleep_quality <= 2) {
    suggestions.push(t('suggest_poor_sleep'));
  }

  if (checkin.muscle_soreness >= 4) {
    suggestions.push(t('suggest_high_soreness'));
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {suggestions.map((s, i) => (
        <div key={i} className="px-3 py-2 rounded-lg bg-accent/50 border border-accent text-xs text-foreground">{s}</div>
      ))}
    </div>
  );
};

export default CoachSuggestion;