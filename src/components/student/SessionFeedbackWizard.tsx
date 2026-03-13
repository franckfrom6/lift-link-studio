import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronRight, MessageSquare, ThumbsUp, ThumbsDown, Check } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
}

interface SessionFeedbackWizardProps {
  exercises: Exercise[];
  onSubmit: (feedback: FeedbackData) => void;
  onSkip: () => void;
}

export interface FeedbackData {
  overall_rating: number;
  exercises_too_easy: string[];
  exercises_too_hard: string[];
  exercises_pain: string[];
  joint_discomfort: boolean;
  joint_discomfort_location: string[];
  joint_discomfort_details: string;
  mood_after: string | null;
  free_comment: string;
  would_repeat: boolean;
}

const RATINGS = [
  { value: 1, emoji: "😴", color: "bg-info-bg text-info border-info/30" },
  { value: 2, emoji: "😐", color: "bg-success-bg text-success border-success/30" },
  { value: 3, emoji: "💪", color: "bg-success-bg text-success border-success/30" },
  { value: 4, emoji: "🥵", color: "bg-warning-bg text-warning border-warning/30" },
  { value: 5, emoji: "🤯", color: "bg-danger-bg text-destructive border-destructive/30" },
];

const MOODS = [
  { value: "energized", emoji: "⚡" },
  { value: "neutral", emoji: "😐" },
  { value: "exhausted", emoji: "😩" },
  { value: "frustrated", emoji: "😤" },
  { value: "satisfied", emoji: "😊" },
];

const SessionFeedbackWizard = ({ exercises, onSubmit, onSkip }: SessionFeedbackWizardProps) => {
  const { t } = useTranslation("feedback");
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [exTooEasy, setExTooEasy] = useState<string[]>([]);
  const [exTooHard, setExTooHard] = useState<string[]>([]);
  const [exPain, setExPain] = useState<string[]>([]);
  const [painLocation, setPainLocation] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [wouldRepeat, setWouldRepeat] = useState(false);

  const handleSubmit = () => {
    onSubmit({
      overall_rating: rating || 3,
      exercises_too_easy: exTooEasy,
      exercises_too_hard: exTooHard,
      exercises_pain: exPain,
      joint_discomfort: exPain.length > 0,
      joint_discomfort_location: painLocation ? painLocation.split(",").map(s => s.trim()) : [],
      joint_discomfort_details: painLocation,
      mood_after: mood,
      free_comment: comment,
      would_repeat: wouldRepeat,
    });
  };

  const toggleExercise = (id: string, list: string[], setList: (v: string[]) => void, ...clearLists: [string[], (v: string[]) => void][]) => {
    if (list.includes(id)) {
      setList(list.filter(x => x !== id));
    } else {
      setList([...list, id]);
      clearLists.forEach(([cl, setCl]) => setCl(cl.filter(x => x !== id)));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-xs text-center text-muted-foreground">{t("feedback_encouragement")}</p>

      {/* Step 0: Overall rating */}
      {step === 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-center">{t("post_session_title")}</h2>
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={t("overall_rating")}>
            {RATINGS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRating(r.value)}
                role="radio"
                aria-checked={rating === r.value}
                aria-label={t(`rating_${r.value}`)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  rating === r.value ? r.color + " border-current scale-105" : "border-border bg-card hover:bg-secondary"
                )}
              >
                <span className="text-2xl" aria-hidden="true">{r.emoji}</span>
                <span className="text-[10px] font-medium leading-tight text-center">
                  {t(`rating_${r.value}`)}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onSkip}>{t("skip")}</Button>
            <Button className="flex-1" disabled={!rating} onClick={() => setStep(1)}>
              {t("next")} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Exercise feedback */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-bold">{t("step_exercises_title")}</h2>
            <p className="text-xs text-muted-foreground">{t("step_exercises_optional")}</p>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {exercises.map((ex) => {
              const isEasy = exTooEasy.includes(ex.id);
              const isHard = exTooHard.includes(ex.id);
              const isPain = exPain.includes(ex.id);
              return (
                <div key={ex.id} className="glass p-3 space-y-2">
                  <p className="text-sm font-medium">{ex.name}</p>
                  <div className="flex gap-1.5" role="group" aria-label={ex.name}>
                    <button
                      onClick={() => toggleExercise(ex.id, exTooEasy, setExTooEasy, [exTooHard, setExTooHard], [exPain, setExPain])}
                      aria-pressed={isEasy}
                      aria-label={t("exercise_too_easy")}
                      className={cn("flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-all flex items-center justify-center gap-1",
                        isEasy ? "bg-success-bg text-success border-success/30" : "border-border hover:bg-secondary"
                      )}
                    >
                      <ThumbsUp className="w-3 h-3" /> {t("exercise_too_easy")}
                    </button>
                    <button
                      onClick={() => {
                        setExTooEasy(exTooEasy.filter(x => x !== ex.id));
                        setExTooHard(exTooHard.filter(x => x !== ex.id));
                        setExPain(exPain.filter(x => x !== ex.id));
                      }}
                      aria-pressed={!isEasy && !isHard && !isPain}
                      aria-label={t("exercise_ok")}
                      className={cn("flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-all flex items-center justify-center gap-1",
                        !isEasy && !isHard && !isPain ? "bg-accent text-accent-foreground border-accent-foreground/20" : "border-border hover:bg-secondary"
                      )}
                    >
                      <Check className="w-3 h-3" /> {t("exercise_ok")}
                    </button>
                    <button
                      onClick={() => toggleExercise(ex.id, exTooHard, setExTooHard, [exTooEasy, setExTooEasy], [exPain, setExPain])}
                      aria-pressed={isHard}
                      aria-label={t("exercise_too_hard")}
                      className={cn("flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-all flex items-center justify-center gap-1",
                        isHard ? "bg-warning-bg text-warning border-warning/30" : "border-border hover:bg-secondary"
                      )}
                    >
                      <ThumbsDown className="w-3 h-3" /> {t("exercise_too_hard")}
                    </button>
                  </div>
                  {(isHard || isPain) && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setExTooHard(exTooHard.filter(x => x !== ex.id));
                          toggleExercise(ex.id, exPain, setExPain, [exTooEasy, setExTooEasy], [exTooHard, setExTooHard]);
                        }}
                        aria-pressed={isPain}
                        aria-label={t("pain_joint")}
                        className={cn("flex-1 py-1 px-2 rounded-lg text-[10px] font-medium border transition-all",
                          isPain ? "bg-danger-bg text-destructive border-destructive/30" : "border-border hover:bg-secondary"
                        )}
                      >
                        🩹 {t("pain_joint")}
                      </button>
                    </div>
                  )}
                  {isPain && (
                    <input
                      type="text"
                      className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2"
                      placeholder={t("pain_where")}
                      value={painLocation}
                      onChange={(e) => setPainLocation(e.target.value)}
                      aria-label={t("pain_where")}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>{t("skip")}</Button>
            <Button className="flex-1" onClick={() => setStep(2)}>
              {t("next")} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Comment + mood */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-bold">{t("step_comment_title")}</h2>
            <p className="text-xs text-muted-foreground">{t("step_comment_optional")}</p>
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("comment_placeholder")}
            className="bg-surface resize-none"
            rows={3}
          />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t("mood_label")}</p>
            <div className="flex gap-2 justify-center" role="radiogroup" aria-label={t("mood_label")}>
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  role="radio"
                  aria-checked={mood === m.value}
                  aria-label={t(`mood_${m.value}`)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all",
                    mood === m.value ? "bg-accent border-accent-foreground/20 scale-105" : "border-border hover:bg-secondary"
                  )}
                >
                  <span className="text-xl" aria-hidden="true">{m.emoji}</span>
                  <span className="text-[9px] font-medium">{t(`mood_${m.value}`)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="would-repeat"
              checked={wouldRepeat}
              onCheckedChange={(v) => setWouldRepeat(v === true)}
            />
            <label htmlFor="would-repeat" className="text-sm">{t("would_repeat")}</label>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onSkip}>{t("skip")}</Button>
            <Button className="flex-1" onClick={handleSubmit}>
              <MessageSquare className="w-4 h-4 mr-1" /> {t("send_feedback")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionFeedbackWizard;
