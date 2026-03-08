import { cn } from "@/lib/utils";
import { CheckinData } from "../student/WeeklyCheckinForm";

interface CoachSuggestionProps {
  checkin: CheckinData;
}

const CoachSuggestion = ({ checkin }: CoachSuggestionProps) => {
  const suggestions: string[] = [];

  if (checkin.energy_level <= 2 && checkin.muscle_soreness >= 3) {
    const hasLegs = checkin.soreness_location.some(l => l === "jambes");
    if (hasLegs) {
      suggestions.push("💡 Envisager un allègement volume lower body cette semaine");
    } else {
      suggestions.push("💡 Envisager une réduction du volume global cette semaine");
    }
  }

  if (checkin.energy_level <= 2) {
    suggestions.push("💡 Privilégier les exercices à RPE modéré (6-7)");
  }

  if (checkin.stress_level >= 4) {
    suggestions.push("💡 Stress élevé — Privilégier les exercices à RPE modéré et la récupération active");
  }

  if (checkin.sleep_quality <= 2) {
    suggestions.push("💡 Sommeil insuffisant — Réduire le volume et surveiller la fatigue intra-séance");
  }

  if (checkin.muscle_soreness >= 4) {
    suggestions.push("💡 Courbatures importantes — Adapter l'échauffement et le volume des zones concernées");
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {suggestions.map((s, i) => (
        <div key={i} className="px-3 py-2 rounded-lg bg-accent/50 border border-accent text-xs text-foreground">
          {s}
        </div>
      ))}
    </div>
  );
};

export default CoachSuggestion;
