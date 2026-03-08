import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { AlertTriangle, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeedbackData {
  overall_rating: number;
  energy_post?: number;
  muscle_pump?: number;
  joint_discomfort: boolean;
  joint_discomfort_location?: string[];
  joint_discomfort_details?: string;
  exercises_too_easy?: string[];
  exercises_too_hard?: string[];
  exercises_pain?: string[];
  mood_after?: string;
  free_comment?: string;
  would_repeat?: boolean;
}

interface CoachFeedbackViewProps {
  feedback: FeedbackData;
  studentName: string;
  exerciseNames?: Record<string, string>; // id → name map
}

const MOOD_EMOJIS: Record<string, string> = {
  energized: "⚡",
  neutral: "😐",
  exhausted: "😩",
  frustrated: "😤",
  satisfied: "😊",
};

const CoachFeedbackView = ({ feedback, studentName, exerciseNames = {} }: CoachFeedbackViewProps) => {
  const { t } = useTranslation("feedback");

  const ratingColors = [
    "",
    "text-info",
    "text-success",
    "text-success",
    "text-warning",
    "text-destructive",
  ];

  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">{t("feedback_of", { name: studentName })}</h3>
        <FeedbackBadge rating={feedback.overall_rating} jointDiscomfort={feedback.joint_discomfort} />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">{t("overall_rating")}:</span>{" "}
          <span className={cn("font-bold", ratingColors[feedback.overall_rating])}>
            {feedback.overall_rating}/5
          </span>
        </div>
        {feedback.mood_after && (
          <div>
            <span className="text-muted-foreground">{t("mood_label")}:</span>{" "}
            <span>{MOOD_EMOJIS[feedback.mood_after]} {t(`mood_${feedback.mood_after}`)}</span>
          </div>
        )}
      </div>

      {feedback.joint_discomfort && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-danger-bg text-destructive text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{t("pain_joint")}</span>
            {feedback.joint_discomfort_location?.length ? (
              <span>: {feedback.joint_discomfort_location.join(", ")}</span>
            ) : null}
            {feedback.joint_discomfort_details && <p className="mt-0.5">{feedback.joint_discomfort_details}</p>}
          </div>
        </div>
      )}

      {((feedback.exercises_too_easy?.length || 0) > 0 || (feedback.exercises_too_hard?.length || 0) > 0 || (feedback.exercises_pain?.length || 0) > 0) && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("exercises_flagged")}:</p>
          {feedback.exercises_too_easy?.map((id) => (
            <div key={`easy-${id}`} className="flex items-center gap-2 text-xs">
              <ThumbsUp className="w-3 h-3 text-success" />
              <span>{exerciseNames[id] || id}</span>
              <span className="text-muted-foreground">→ {t("exercise_too_easy")}</span>
            </div>
          ))}
          {feedback.exercises_too_hard?.map((id) => (
            <div key={`hard-${id}`} className="flex items-center gap-2 text-xs">
              <ThumbsDown className="w-3 h-3 text-warning" />
              <span>{exerciseNames[id] || id}</span>
              <span className="text-muted-foreground">→ {t("exercise_too_hard")}</span>
            </div>
          ))}
          {feedback.exercises_pain?.map((id) => (
            <div key={`pain-${id}`} className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-3 h-3 text-destructive" />
              <span>{exerciseNames[id] || id}</span>
              <span className="text-muted-foreground">→ {t("exercise_pain")}</span>
            </div>
          ))}
        </div>
      )}

      {feedback.free_comment && (
        <div className="flex items-start gap-2 text-xs">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="italic">"{feedback.free_comment}"</p>
        </div>
      )}

      {feedback.would_repeat !== undefined && feedback.would_repeat !== null && (
        <p className="text-xs text-muted-foreground">
          {feedback.would_repeat ? `✅ ${t("would_repeat_yes")}` : `❌ ${t("would_not_repeat")}`}
        </p>
      )}
    </div>
  );
};

export const FeedbackBadge = ({ rating, jointDiscomfort }: { rating: number; jointDiscomfort?: boolean }) => {
  const { t } = useTranslation("feedback");

  if (jointDiscomfort) {
    return <Badge variant="outline" className="text-destructive border-destructive/30 bg-danger-bg text-[10px]">⚠️ {t("badge_pain")}</Badge>;
  }

  const config: Record<number, { label: string; className: string }> = {
    1: { label: t("badge_easy"), className: "text-info border-info/30 bg-info-bg" },
    2: { label: t("badge_easy"), className: "text-success border-success/30 bg-success-bg" },
    3: { label: t("badge_perfect"), className: "text-success border-success/30 bg-success-bg" },
    4: { label: t("badge_intense"), className: "text-warning border-warning/30 bg-warning-bg" },
    5: { label: t("badge_too_hard"), className: "text-destructive border-destructive/30 bg-danger-bg" },
  };

  const c = config[rating] || config[3];
  return <Badge variant="outline" className={cn("text-[10px]", c.className)}>{c.label}</Badge>;
};

export default CoachFeedbackView;
