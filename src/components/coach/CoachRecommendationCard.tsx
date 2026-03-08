import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import RecommendationCategoryBadge from "./RecommendationCategoryBadge";

interface Props {
  reco: {
    id: string;
    title: string;
    content: string;
    category: string;
    trigger_type: string | null;
    trigger_config: any;
    is_active: boolean;
    priority: number;
    student_id: string | null;
    student_name?: string;
    video_url?: string | null;
    duration_minutes?: number | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

const CoachRecommendationCard = ({ reco, onEdit, onDelete }: Props) => {
  const { t } = useTranslation("recommendations");

  const priorityDots = (p: number) => {
    if (p === 1) return "●●● " + t("priority_high");
    if (p === 3) return "● " + t("priority_low");
    return "●● " + t("priority_medium");
  };

  const triggerLabel = () => {
    if (!reco.trigger_type || reco.trigger_type === "always") return t("trigger_always");
    if (reco.trigger_type === "post_session") {
      const groups = reco.trigger_config?.muscle_groups?.join(", ") || "";
      return `${t("trigger_post_session")} ${groups ? `[${groups}]` : ""}`;
    }
    if (reco.trigger_type === "specific_day") return t("trigger_specific_day");
    if (reco.trigger_type === "when_deficit") return t("trigger_when_deficit");
    if (reco.trigger_type === "high_soreness") return t("trigger_high_soreness");
    if (reco.trigger_type === "deload_week") return t("trigger_deload_week");
    return reco.trigger_type;
  };

  return (
    <div className={`glass p-4 space-y-2 ${!reco.is_active ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${reco.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
            <span className="font-semibold text-sm truncate">{reco.title}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {reco.student_id ? (
              <span className="text-xs text-muted-foreground">👤 {reco.student_name || "?"}</span>
            ) : (
              <span className="text-xs text-muted-foreground">📋 {t("global_label")}</span>
            )}
            <RecommendationCategoryBadge category={reco.category} />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{reco.content}</p>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>⏰ {triggerLabel()}</span>
        <span>{priorityDots(reco.priority)}</span>
        {reco.duration_minutes && <span>⏱ {reco.duration_minutes} min</span>}
      </div>
    </div>
  );
};

export default CoachRecommendationCard;
