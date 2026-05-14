import { CompletedSet } from "@/components/student/ExerciseTracker";
import { ProgramExerciseDetail } from "@/data/yana-program";
import { Trophy, Clock, Dumbbell, TrendingUp, MessageSquare, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import RecommendationSheet from "@/components/nutrition/RecommendationSheet";
import SessionFeedbackWizard, { FeedbackData } from "@/components/student/SessionFeedbackWizard";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";

// Counting-up hook
function useCountUp(target: number, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);
  return value;
}

interface SessionRecapProps {
  exercises: ProgramExerciseDetail[];
  completedSets: Record<number, CompletedSet[]>;
  duration: number;
  onClose: () => void;
  muscleGroups?: string[];
  activityType?: string | null;
  completedSessionId?: string;
  sessionName?: string;
}

const SessionRecap = ({ exercises, completedSets, duration, onClose, muscleGroups, activityType, completedSessionId, sessionName }: SessionRecapProps) => {
  const { t } = useTranslation(['session', 'feedback']);
  const { user } = useAuth();
  const isAdvanced = useIsAdvanced();
  const [recoOpen, setRecoOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const motivationalPhrase = useRef(
    ["Séance validée 💪", "On lâche rien 🔥", "Chaque rep compte ✅", "La régularité paie 📈", "Beast mode ON 🏋️"][
      Math.floor(Math.random() * 5)
    ]
  ).current;

  // Confetti + vibrate on mount
  useEffect(() => {
    try { navigator.vibrate?.([300, 100, 300, 100, 500]); } catch {}
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#ef4444'],
      });
    } catch {}
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

  // Count-up animations (Advanced = all, Simple = just volume)
  const animatedVolume = useCountUp(Math.round(totalVolume), 1500, isAdvanced);
  const animatedSets = useCountUp(totalSets, 800, isAdvanced);
  const animatedReps = useCountUp(totalReps, 1000, isAdvanced);

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

  const handleShareCard = async () => {
    const node = shareCardRef.current;
    if (!node) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(node, { backgroundColor: null, scale: 2 });
      await new Promise<void>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) { resolve(); return; }
          const file = new File([blob], "seance-f6gym.png", { type: "image/png" });
          try {
            if (navigator.share && (navigator as any).canShare?.({ files: [file] })) {
              await navigator.share({ files: [file], title: "Ma séance F6Gym" });
            } else {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "seance-f6gym.png";
              a.click();
            }
          } catch (e) {
            console.error("Share failed:", e);
          }
          resolve();
        }, "image/png");
      });
    } catch (e) {
      console.error("Capture failed:", e);
      toast.error("Impossible de générer l'image");
    } finally {
      setSharing(false);
    }
  };

  const dateLabel = new Intl.DateTimeFormat("fr", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  if (showFeedback && !feedbackDone) {
    return (
      <SessionFeedbackWizard
        exercises={feedbackExercises}
        onSubmit={handleFeedbackSubmit}
        onSkip={() => { setShowFeedback(false); setFeedbackDone(true); }}
      />
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { delay: i * 0.1, type: "spring" as const, stiffness: 300, damping: 25 }
    }),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        className="text-center space-y-3 py-2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          className="w-14 h-14 rounded-2xl bg-success-bg flex items-center justify-center mx-auto"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
        >
          <Trophy className="w-7 h-7 text-success" strokeWidth={2} />
        </motion.div>
        <h1 className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground">{t('session:session_done')}</h1>
        <p className="text-sm text-muted-foreground">{t('session:excellent_work')}</p>
      </motion.div>

      {/* HERO METRIC — Volume géant en signature primary */}
      <motion.div
        className="text-center py-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 25 }}
      >
        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold mb-1">
          {t('session:volume', 'Volume total')}
        </span>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-7xl font-black tabular-nums text-primary leading-none">
            {(isAdvanced ? animatedVolume : Math.round(totalVolume)).toLocaleString()}
          </span>
          <span className="text-xl font-bold text-muted-foreground">kg</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Clock, value: `${mins}:${secs.toString().padStart(2, "0")}`, label: t('session:duration'), raw: true },
          { icon: TrendingUp, value: isAdvanced ? animatedSets : totalSets, label: t('session:sets') },
          { icon: Dumbbell, value: isAdvanced ? animatedReps : totalReps, label: t('session:reps') },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="rounded-xl border border-border bg-card p-3 text-center"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            {stat.icon && <stat.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" strokeWidth={2} />}
            <p className="text-xl font-black tabular-nums leading-none">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="glass p-4 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
      >
        <h3 className="font-bold text-sm">{t('session:exercise_detail')}</h3>
        {exercises.map((ex, i) => {
          const sets = completedSets[i] || [];
          if (sets.length === 0) return null;
          const exVolume = sets.reduce((a, s) => a + s.weight * s.reps, 0);
          return (
            <motion.div
              key={i}
              className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.05 }}
            >
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
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
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
        <Button
          variant="outline"
          className="w-full h-12 font-semibold gap-2"
          onClick={handleShareCard}
          disabled={sharing}
        >
          <Share2 className="w-4 h-4" strokeWidth={1.5} />
          {sharing ? "Génération..." : "Partager sur mes réseaux"}
        </Button>
      </motion.div>

      <RecommendationSheet
        open={recoOpen}
        onClose={() => setRecoOpen(false)}
        triggerType="post_session"
        activityType={activityType || null}
        muscleGroups={muscleGroups || ["glutes", "quads", "hamstrings"]}
      />

      {/* Off-screen share card — captured by html2canvas */}
      <div
        ref={shareCardRef}
        id="share-card"
        style={{ position: "absolute", left: "-9999px", top: 0, width: "400px", height: "220px" }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 flex flex-col justify-between"
      >
        <div className="flex items-start justify-between">
          <span className="text-white font-black text-lg tracking-tight">F6GYM</span>
          <span className="text-[11px] text-gray-300 italic">{motivationalPhrase}</span>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold leading-tight truncate">{sessionName || "Séance terminée"}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm">
            <div className="text-center">
              <p className="text-lg font-black tabular-nums">{mins}:{secs.toString().padStart(2, "0")}</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-400">Durée</p>
            </div>
            <div className="w-px h-8 bg-gray-600" />
            <div className="text-center">
              <p className="text-lg font-black tabular-nums">{totalSets}</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-400">Séries</p>
            </div>
            <div className="w-px h-8 bg-gray-600" />
            <div className="text-center">
              <p className="text-lg font-black tabular-nums">{Math.round(totalVolume).toLocaleString()} kg</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-400">Volume</p>
            </div>
          </div>
        </div>
        <div className="flex items-end justify-between text-[10px]">
          <span className="text-gray-300 capitalize">{dateLabel}</span>
          <span className="text-gray-400">@f6gym</span>
        </div>
      </div>
    </div>
  );
};

export default SessionRecap;
