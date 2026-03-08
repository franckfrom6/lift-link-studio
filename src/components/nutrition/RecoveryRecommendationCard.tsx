import { cn } from "@/lib/utils";
import { X, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RecoveryRecommendation {
  id: string;
  trigger_type: string;
  activity_type: string | null;
  muscle_groups: string[];
  recommendation_type: string;
  title_fr: string;
  title_en: string;
  content_fr: string;
  content_en: string;
  priority: number;
}

interface RecoveryRecommendationCardProps {
  recommendation: RecoveryRecommendation;
  onDismiss?: () => void;
  onSave?: () => void;
  lang?: "fr" | "en";
}

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  nutrition: { bg: "bg-info-bg", border: "border-info/20", icon: "🥤" },
  recovery: { bg: "bg-accent", border: "border-primary/20", icon: "🧊" },
  sleep: { bg: "bg-secondary", border: "border-border", icon: "😴" },
  mobility: { bg: "bg-success-bg", border: "border-success/20", icon: "🧘" },
};

const RecoveryRecommendationCard = ({ recommendation, onDismiss, onSave, lang = "fr" }: RecoveryRecommendationCardProps) => {
  const style = TYPE_STYLES[recommendation.recommendation_type] || TYPE_STYLES.recovery;
  const title = lang === "fr" ? recommendation.title_fr : recommendation.title_en;
  const content = lang === "fr" ? recommendation.content_fr : recommendation.content_en;

  return (
    <div className={cn("rounded-xl border p-4 space-y-2", style.bg, style.border)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{style.icon}</span>
          <h4 className="text-sm font-bold">{title}</h4>
        </div>
        <div className="flex gap-1">
          {onSave && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSave}>
              <Bookmark className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
      {recommendation.priority === 1 && (
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary bg-accent px-2 py-0.5 rounded-md">
          Essentiel
        </span>
      )}
    </div>
  );
};

export default RecoveryRecommendationCard;
