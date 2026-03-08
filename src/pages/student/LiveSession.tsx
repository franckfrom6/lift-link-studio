import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { YANA_PROGRAM, ProgramExerciseDetail, ProgramSection } from "@/data/yana-program";
import { EnhancedCompletedSet } from "@/components/student/EnhancedExerciseCard";
import EnhancedExerciseCard from "@/components/student/EnhancedExerciseCard";
import SessionSection from "@/components/student/SessionSection";
import SessionRecap from "@/components/student/SessionRecap";
import ProgressionTimeline, { ProgressionPhase } from "@/components/student/ProgressionTimeline";
import { ArrowLeft, Clock, ListOrdered, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Build progression phases from yana-program data
const progressionPhases: ProgressionPhase[] = YANA_PROGRAM.progression.map((p, i) => {
  const weekMatch = p.match(/Semaine[s]?\s+(\d+)(?:\s*[-–]\s*(\d+))?/i);
  const weekStart = weekMatch ? parseInt(weekMatch[1]) : i + 1;
  const weekEnd = weekMatch && weekMatch[2] ? parseInt(weekMatch[2]) : weekStart;
  return {
    id: `prog-${i}`,
    weekLabel: p.split(":")[0]?.trim() || `Phase ${i + 1}`,
    description: p.split(":").slice(1).join(":").trim() || p,
    weekStart,
    weekEnd,
    isDeload: p.toLowerCase().includes("deload"),
    order: i,
  };
});

const LiveSession = () => {
  const navigate = useNavigate();
  const [completedSets, setCompletedSets] = useState<Record<string, EnhancedCompletedSet[]>>({});
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [activeExerciseKey, setActiveExerciseKey] = useState<string>("0-0");
  const [showProgression, setShowProgression] = useState(false);

  const allExercises: ProgramExerciseDetail[] = YANA_PROGRAM.sections.flatMap((s) => s.exercises);

  useEffect(() => {
    if (sessionDone) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, sessionDone]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // Count completed exercises
  const completedCount = Object.values(completedSets).filter(sets => sets.length > 0 && sets.every(s => s.reps > 0)).length;

  const handleExerciseComplete = (key: string) => {
    // Auto-advance to next exercise
    const [sIdx, eIdx] = key.split("-").map(Number);
    let nextKey: string | null = null;
    
    // Find next exercise
    for (let si = sIdx; si < YANA_PROGRAM.sections.length; si++) {
      const startEi = si === sIdx ? eIdx + 1 : 0;
      for (let ei = startEi; ei < YANA_PROGRAM.sections[si].exercises.length; ei++) {
        nextKey = `${si}-${ei}`;
        break;
      }
      if (nextKey) break;
    }

    if (nextKey) {
      setActiveExerciseKey(nextKey);
    } else {
      setSessionDone(true);
      toast.success("Séance terminée ! 💪");
    }
  };

  const handleClose = () => {
    toast.success("Séance sauvegardée !");
    navigate("/student");
  };

  if (sessionDone) {
    return (
      <div className="max-w-lg mx-auto">
        <SessionRecap
          exercises={allExercises}
          completedSets={
            // Convert to old format for recap
            Object.fromEntries(
              Object.entries(completedSets).map(([key, sets]) => {
                let globalIdx = 0;
                const [sIdx, eIdx] = key.split("-").map(Number);
                for (let i = 0; i < sIdx; i++) globalIdx += YANA_PROGRAM.sections[i].exercises.length;
                globalIdx += eIdx;
                return [globalIdx, sets.map(s => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps, isFailure: s.isFailure }))];
              })
            )
          }
          duration={elapsed}
          onClose={handleClose}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 -mx-4 px-4 pt-2 border-b border-border/30">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/student")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quitter
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={showProgression ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowProgression(!showProgression)}
              className="gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Progression
            </Button>
            <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-display font-bold tabular-nums">
                {mins}:{secs.toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Session info header */}
        <div className="flex items-center gap-3 mt-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{YANA_PROGRAM.title}</p>
            <p className="text-[11px] text-muted-foreground">{YANA_PROGRAM.client}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {YANA_PROGRAM.duration}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / allExercises.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
            {completedCount}/{allExercises.length}
          </span>
        </div>
      </div>

      {/* Progression panel */}
      {showProgression && (
        <div className="bg-card border border-border rounded-xl p-4 animate-fade-in">
          <h3 className="font-display font-bold text-sm mb-3">Plan de progression</h3>
          <ProgressionTimeline phases={progressionPhases} currentWeek={1} />
        </div>
      )}

      {/* Sections with exercises */}
      <div className="space-y-4">
        {YANA_PROGRAM.sections.map((section, sIdx) => {
          const sectionHasActive = section.exercises.some((_, eIdx) => `${sIdx}-${eIdx}` === activeExerciseKey);

          // Extract icon from section name (emoji)
          const emojiMatch = section.name.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
          const icon = emojiMatch ? emojiMatch[1] : null;
          const cleanName = icon ? section.name.replace(icon, "").trim() : section.name;

          return (
            <SessionSection
              key={sIdx}
              name={cleanName}
              icon={icon}
              durationEstimate={section.duration}
              notes={section.notes}
              isActive={sectionHasActive}
            >
              {section.exercises.map((ex, eIdx) => {
                const key = `${sIdx}-${eIdx}`;
                const isActive = key === activeExerciseKey;
                const sets = completedSets[key] || [];

                // Parse exercise data
                const targetSets = parseInt(ex.sets) || 1;
                const repsMatch = ex.reps.match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
                const repsMin = repsMatch ? parseInt(repsMatch[1]) : 0;
                const repsMax = repsMatch && repsMatch[2] ? parseInt(repsMatch[2]) : repsMin;
                const restMatch = ex.rest.match(/(\d+)/);
                let restSeconds = 60;
                if (restMatch) {
                  const num = parseInt(restMatch[1]);
                  restSeconds = (ex.rest.includes("'") || ex.rest.includes("min")) ? num * 60 : num;
                }
                if (ex.rest === "—" || !ex.rest) restSeconds = 0;

                return (
                  <div
                    key={key}
                    onClick={() => !isActive && setActiveExerciseKey(key)}
                    className={cn(!isActive && "cursor-pointer")}
                  >
                    <EnhancedExerciseCard
                      name={ex.name}
                      sets={targetSets}
                      repsMin={repsMin}
                      repsMax={repsMax}
                      restSeconds={restSeconds}
                      tempo={ex.tempo || null}
                      rpeTarget={ex.rpe || null}
                      suggestedWeight={null}
                      coachNotes={ex.notes || null}
                      videoUrl={ex.video || null}
                      videoSearchQuery={null}
                      isActive={isActive}
                      completedSets={sets}
                      onCompletedSetsChange={(newSets) => setCompletedSets(prev => ({ ...prev, [key]: newSets }))}
                      onAllSetsComplete={() => handleExerciseComplete(key)}
                    />
                  </div>
                );
              })}
            </SessionSection>
          );
        })}
      </div>

      {/* Finish button */}
      <div className="py-4">
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={() => { setSessionDone(true); toast.success("Séance terminée ! 💪"); }}
          disabled={completedCount === 0}
        >
          Terminer la séance ({completedCount}/{allExercises.length} exercices)
        </Button>
      </div>
    </div>
  );
};

export default LiveSession;
