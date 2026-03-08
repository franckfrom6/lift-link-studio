import { CompletedSet } from "@/components/student/ExerciseTracker";
import { ProgramExerciseDetail } from "@/data/yana-program";
import { Trophy, Clock, Dumbbell, TrendingUp, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import RecommendationSheet from "@/components/nutrition/RecommendationSheet";
import { useTranslation } from "react-i18next";

interface SessionRecapProps {
  exercises: ProgramExerciseDetail[];
  completedSets: Record<number, CompletedSet[]>;
  duration: number;
  onClose: () => void;
  muscleGroups?: string[];
  activityType?: string | null;
}

const SessionRecap = ({ exercises, completedSets, duration, onClose, muscleGroups, activityType }: SessionRecapProps) => {
  const { t } = useTranslation('session');
  const [feedback, setFeedback] = useState("");
  const [recoOpen, setRecoOpen] = useState(false);

  const totalSets = Object.values(completedSets).reduce((acc, sets) => acc + sets.length, 0);
  const totalReps = Object.values(completedSets).reduce(
    (acc, sets) => acc + sets.reduce((a, s) => a + s.reps, 0), 0
  );
  const totalVolume = Object.values(completedSets).reduce(
    (acc, sets) => acc + sets.reduce((a, s) => a + s.weight * s.reps, 0), 0
  );

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3 py-4">
        <div className="w-16 h-16 rounded-2xl bg-success-bg flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-success" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold">{t('session_done')}</h1>
        <p className="text-muted-foreground">{t('excellent_work')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 text-center">
          <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-2xl font-bold">{mins}:{secs.toString().padStart(2, "0")}</p>
          <p className="text-xs text-muted-foreground">{t('duration')}</p>
        </div>
        <div className="glass p-4 text-center">
          <Dumbbell className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-2xl font-bold">{Math.round(totalVolume).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t('volume')}</p>
        </div>
        <div className="glass p-4 text-center">
          <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-2xl font-bold">{totalSets}</p>
          <p className="text-xs text-muted-foreground">{t('sets')}</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold">{totalReps}</p>
          <p className="text-xs text-muted-foreground">{t('reps')}</p>
        </div>
      </div>

      <div className="glass p-4 space-y-3">
        <h3 className="font-bold text-sm">{t('exercise_detail')}</h3>
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
                  {sets.length} {t('sets_unit')} · {sets.reduce((a, s) => a + s.reps, 0)} {t('reps_unit')} · {Math.round(exVolume)} {t('vol_unit')}
                </p>
              </div>
              {sets.some((s) => s.isFailure) && (
                <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-md font-medium">{t('failure')}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <label className="text-sm font-medium">{t('feedback_label')}</label>
        </div>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t('feedback_placeholder')}
          className="bg-surface resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 h-12 font-semibold gap-2" onClick={() => setRecoOpen(true)}>
          <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          {t('view_recos')}
        </Button>
        <Button className="flex-1 h-12 font-semibold" onClick={onClose}>
          {t('finish_save')}
        </Button>
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