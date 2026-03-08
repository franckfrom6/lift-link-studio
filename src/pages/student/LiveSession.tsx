import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { YANA_PROGRAM, ProgramExerciseDetail } from "@/data/yana-program";
import ExerciseTracker, { CompletedSet } from "@/components/student/ExerciseTracker";
import SessionRecap from "@/components/student/SessionRecap";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LiveSession = () => {
  const navigate = useNavigate();
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<number, CompletedSet[]>>({});
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Flatten all exercises from all sections (skip warm-up and cool-down for tracking, but include them)
  const allExercises: ProgramExerciseDetail[] = YANA_PROGRAM.sections.flatMap((s) => s.exercises);

  // Timer
  useEffect(() => {
    if (sessionDone) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, sessionDone]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const handleExerciseComplete = (sets: CompletedSet[]) => {
    setCompletedSets((prev) => ({ ...prev, [currentExerciseIdx]: sets }));
  };

  const handleNext = () => {
    if (currentExerciseIdx < allExercises.length - 1) {
      setCurrentExerciseIdx((prev) => prev + 1);
    } else {
      setSessionDone(true);
      toast.success("Séance terminée !");
    }
  };

  const handlePrev = () => {
    if (currentExerciseIdx > 0) {
      setCurrentExerciseIdx((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    toast.success("Séance sauvegardée !");
    navigate("/student");
  };

  // Find current section name
  let exerciseCounter = 0;
  let currentSectionName = "";
  for (const section of YANA_PROGRAM.sections) {
    if (currentExerciseIdx < exerciseCounter + section.exercises.length) {
      currentSectionName = section.name;
      break;
    }
    exerciseCounter += section.exercises.length;
  }

  if (sessionDone) {
    return (
      <div className="max-w-lg mx-auto">
        <SessionRecap
          exercises={allExercises}
          completedSets={completedSets}
          duration={elapsed}
          onClose={handleClose}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/student")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quitter
        </Button>
        <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-display font-bold tabular-nums">
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Section indicator */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground bg-surface px-3 py-1 rounded-full">
          {currentSectionName}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentExerciseIdx + 1) / allExercises.length) * 100}%` }}
        />
      </div>

      {/* Exercise tracker */}
      <ExerciseTracker
        key={currentExerciseIdx}
        exercise={allExercises[currentExerciseIdx]}
        index={currentExerciseIdx}
        total={allExercises.length}
        onComplete={handleExerciseComplete}
        onPrev={handlePrev}
        onNext={handleNext}
        isFirst={currentExerciseIdx === 0}
        isLast={currentExerciseIdx === allExercises.length - 1}
      />
    </div>
  );
};

export default LiveSession;
