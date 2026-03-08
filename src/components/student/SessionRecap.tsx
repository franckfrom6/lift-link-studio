import { CompletedSet } from "@/components/student/ExerciseTracker";
import { ProgramExerciseDetail } from "@/data/yana-program";
import { Trophy, Clock, Dumbbell, TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface SessionRecapProps {
  exercises: ProgramExerciseDetail[];
  completedSets: Record<number, CompletedSet[]>;
  duration: number; // seconds
  onClose: () => void;
}

const SessionRecap = ({ exercises, completedSets, duration, onClose }: SessionRecapProps) => {
  const [feedback, setFeedback] = useState("");

  const totalSets = Object.values(completedSets).reduce((acc, sets) => acc + sets.length, 0);
  const totalReps = Object.values(completedSets).reduce(
    (acc, sets) => acc + sets.reduce((a, s) => a + s.reps, 0), 0
  );
  const totalVolume = Object.values(completedSets).reduce(
    (acc, sets) => acc + sets.reduce((a, s) => a + s.weight * s.reps, 0), 0
  );
  const failureSets = Object.values(completedSets).reduce(
    (acc, sets) => acc + sets.filter((s) => s.isFailure).length, 0
  );

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-3 py-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto animate-pulse-glow">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold">Séance terminée ! 💪</h1>
        <p className="text-muted-foreground">Excellent travail, voici ton récap</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-display font-bold">{mins}:{secs.toString().padStart(2, "0")}</p>
          <p className="text-xs text-muted-foreground">Durée</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Dumbbell className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-display font-bold">{Math.round(totalVolume).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Volume (kg)</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-display font-bold">{totalSets}</p>
          <p className="text-xs text-muted-foreground">Séries</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold">{totalReps}</p>
          <p className="text-xs text-muted-foreground">Répétitions</p>
        </div>
      </div>

      {/* Exercise breakdown */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="font-display font-bold text-sm">Détail par exercice</h3>
        {exercises.map((ex, i) => {
          const sets = completedSets[i] || [];
          if (sets.length === 0) return null;
          const exVolume = sets.reduce((a, s) => a + s.weight * s.reps, 0);
          return (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <span className="text-xs font-bold text-primary w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {sets.length} séries · {sets.reduce((a, s) => a + s.reps, 0)} reps · {Math.round(exVolume)} kg vol.
                </p>
              </div>
              {sets.some((s) => s.isFailure) && (
                <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded font-medium">Failure</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <label className="text-sm font-medium">Note / Feedback (optionnel)</label>
        </div>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Comment t'es-tu senti ? Des douleurs ? Des records ?"
          className="bg-surface resize-none"
          rows={3}
        />
      </div>

      <Button className="w-full h-12 text-base font-semibold" onClick={onClose}>
        Terminer et sauvegarder
      </Button>
    </div>
  );
};

export default SessionRecap;
