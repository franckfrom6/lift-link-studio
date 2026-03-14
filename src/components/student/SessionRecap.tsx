import { CompletedSet } from "@/components/student/ExerciseTracker";
import { ProgramExerciseDetail } from "@/data/yana-program";
import { Trophy, Clock, Dumbbell, TrendingUp, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import RecommendationSheet from "@/components/nutrition/RecommendationSheet";
import RecommendationSheet from "@/components/nutrition/RecommendationSheet";
import SessionFeedbackWizard, { FeedbackData } from "@/components/student/SessionFeedbackWizard";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SessionRecapProps {
  exercises: ProgramExerciseDetail[];
  completedSets: Record<number, CompletedSet[]>;
  duration: number;
  onClose: () => void;
  muscleGroups?: string[];
  activityType?: string | null;
  completedSessionId?: string;
}

const SessionRecap = ({ exercises, completedSets, duration, onClose, muscleGroups, activityType, completedSessionId }: SessionRecapProps) => {
  const { t } = useTranslation(['session', 'feedback']);
  const { user } = useAuth();
  const [recoOpen, setRecoOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  // Vibrate on session complete
  useEffect(() => {
    try { navigator.vibrate?.([300, 100, 300, 100, 500]); } catch {}
  }, []);

  const totalSets = Object.values(completedSets).reduce((acc, sets) => acc + sets.length, 0);
  const totalReps = Object.values(completedSets).reduce(
    (acc, sets) => acc + sets.reduce((a, s) => a + s.reps, 0), 0
  );
  const totalVolume = Object.values(completedSets).reduce(
    (acc, sets) => acc + sets.reduce((a, s) => a + s.weight * s.reps, 0), 0
  );

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  const handleFeedbackSubmit = async (feedback: FeedbackData) => {
    if (!user || !completedSessionId) {
      console.warn("Cannot save feedback: missing user or completedSessionId");
      toast.success(t('feedback:feedback_sent'));
      setFeedbackDone(true);
      setShowFeedback(false);
      return;
    }

    try {
      const { error } = await supabase.from("session_feedback").insert({
        completed_session_id: completedSessionId,
        user_id: user.id,
        overall_rating: feedback.overall_rating,
        exercises_too_easy: feedback.exercises_too_easy,
        exercises_too_hard: feedback.exercises_too_hard,
        exercises_pain: feedback.exercises_pain,
        joint_discomfort: feedback.joint_discomfort,
        joint_discomfort_location: feedback.joint_discomfort_location,
        joint_discomfort_details: feedback.joint_discomfort_details,
        mood_after: feedback.mood_after,
        free_comment: feedback.free_comment,
        would_repeat: feedback.would_repeat,
      });
      if (error) throw error;
      toast.success(t('feedback:feedback_sent'));
    } catch (e: any) {
      console.error("Feedback save error:", e);
      toast.error("Erreur lors de l'envoi du feedback");
    }
    setFeedbackDone(true);
    setShowFeedback(false);
  };

  const feedbackExercises = exercises.map((ex, i) => ({
    id: String(i),
    name: ex.name,
  }));

  if (showFeedback && !feedbackDone) {
    return (
      <SessionFeedbackWizard
        exercises={feedbackExercises}
        onSubmit={handleFeedbackSubmit}
        onSkip={() => { setShowFeedback(false); setFeedbackDone(true); }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3 py-4">
        <div className="w-16 h-16 rounded-2xl bg-success-bg flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-success" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold">{t('session:session_done')}</h1>
        <p className="text-muted-foreground">{t('session:excellent_work')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 text-center">
          <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-2xl font-bold">{mins}:{secs.toString().padStart(2, "0")}</p>
          <p className="text-xs text-muted-foreground">{t('session:duration')}</p>
        </div>
        <div className="glass p-4 text-center">
          <Dumbbell className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-2xl font-bold">{Math.round(totalVolume).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t('session:volume')}</p>
        </div>
        <div className="glass p-4 text-center">
          <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-2xl font-bold">{totalSets}</p>
          <p className="text-xs text-muted-foreground">{t('session:sets')}</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold">{totalReps}</p>
          <p className="text-xs text-muted-foreground">{t('session:reps')}</p>
        </div>
      </div>

      <div className="glass p-4 space-y-3">
        <h3 className="font-bold text-sm">{t('session:exercise_detail')}</h3>
        {exercises.map((ex, i) => {
          const sets = completedSets[i] || [];
          if (sets.length === 0) return null;
          const exVolume = sets.reduce((a, s) => a + s.weight * s.reps, 0);
          return (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <span className="text-xs font-bold text-accent-foreground w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {sets.length} {t('session:sets_unit')} · {sets.reduce((a, s) => a + s.reps, 0)} {t('session:reps_unit')} · {Math.round(exVolume)} {t('session:vol_unit')}
                </p>
              </div>
              {sets.some((s) => s.isFailure) && (
                <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-md font-medium">{t('session:failure')}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {!feedbackDone && (
          <Button
            variant="outline"
            className="w-full h-12 font-semibold gap-2"
            onClick={() => setShowFeedback(true)}
          >
            <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
            {t('feedback:feedback_title')}
          </Button>
        )}
        {feedbackDone && (
          <p className="text-center text-sm text-success font-medium">✅ {t('feedback:feedback_sent')}</p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-12 font-semibold gap-2" onClick={() => setRecoOpen(true)}>
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
            {t('session:view_recos')}
          </Button>
          <Button className="flex-1 h-12 font-semibold" onClick={onClose}>
            {t('session:finish_save')}
          </Button>
        </div>
      </div>

      <RecommendationSheet
        open={recoOpen}
        onClose={() => setRecoOpen(false)}
        triggerType="post_session"
        activityType={activityType || null}
        muscleGroups={muscleGroups || ["glutes", "quads", "hamstrings"]}
      />
    </div>
  );
};

export default SessionRecap;
