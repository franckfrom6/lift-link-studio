import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { YANA_PROGRAM, ProgramExerciseDetail, ProgramSection } from "@/data/yana-program";
import ExerciseTracker, { CompletedSet } from "@/components/student/ExerciseTracker";
import SessionRecap from "@/components/student/SessionRecap";
import { ArrowLeft, Clock, ChevronDown, ChevronUp, Check, Play, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const LiveSession = () => {
  const navigate = useNavigate();
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<number, CompletedSet[]>>({});
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showOverview, setShowOverview] = useState(false);

  const allExercises: ProgramExerciseDetail[] = YANA_PROGRAM.sections.flatMap((s) => s.exercises);

  // Build a map: globalIndex -> { sectionIdx, localIdx }
  const exerciseMap: { sectionIdx: number; localIdx: number; globalIdx: number; exercise: ProgramExerciseDetail }[] = [];
  let gi = 0;
  YANA_PROGRAM.sections.forEach((section, si) => {
    section.exercises.forEach((ex, li) => {
      exerciseMap.push({ sectionIdx: si, localIdx: li, globalIdx: gi, exercise: ex });
      gi++;
    });
  });

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

  const jumpToExercise = (globalIdx: number) => {
    setCurrentExerciseIdx(globalIdx);
    setShowOverview(false);
  };

  // Current section
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
        <div className="flex items-center gap-2">
          <Button
            variant={showOverview ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowOverview(!showOverview)}
            className="gap-1.5"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Vue complète
          </Button>
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-display font-bold tabular-nums">
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Full session overview */}
      {showOverview && (
        <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3 space-y-1">
              {YANA_PROGRAM.sections.map((section, sIdx) => {
                const sectionStartIdx = exerciseMap.find(e => e.sectionIdx === sIdx)?.globalIdx ?? 0;
                const sectionExercises = exerciseMap.filter(e => e.sectionIdx === sIdx);

                return (
                  <div key={sIdx}>
                    {/* Section header */}
                    <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {section.name}
                    </div>

                    {/* Exercises in section */}
                    {sectionExercises.map(({ globalIdx, exercise }) => {
                      const isCurrent = globalIdx === currentExerciseIdx;
                      const isCompleted = completedSets[globalIdx] !== undefined;

                      return (
                        <button
                          key={globalIdx}
                          onClick={() => jumpToExercise(globalIdx)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all text-sm",
                            isCurrent && "bg-primary/15 ring-1 ring-primary/30",
                            !isCurrent && isCompleted && "opacity-60",
                            !isCurrent && !isCompleted && "hover:bg-surface/80"
                          )}
                        >
                          {/* Status icon */}
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                            isCurrent && "bg-primary text-primary-foreground",
                            isCompleted && !isCurrent && "bg-primary/20 text-primary",
                            !isCurrent && !isCompleted && "bg-surface text-muted-foreground"
                          )}>
                            {isCompleted ? <Check className="w-3 h-3" /> : (
                              isCurrent ? <Play className="w-3 h-3" /> : globalIdx + 1
                            )}
                          </div>

                          {/* Exercise info */}
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "font-medium truncate text-[13px]",
                              isCurrent ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {exercise.name}
                            </div>
                            <div className="flex gap-1.5 mt-0.5">
                              {exercise.sets && (
                                <span className="text-[10px] text-muted-foreground">
                                  {exercise.sets}s
                                </span>
                              )}
                              {exercise.reps && (
                                <span className="text-[10px] text-muted-foreground">
                                  × {exercise.reps}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Completed badge */}
                          {isCompleted && (
                            <span className="text-[10px] text-primary font-semibold shrink-0">
                              ✓ fait
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

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
