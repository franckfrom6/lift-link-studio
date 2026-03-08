import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStudentProgram, DBSession, DBSection, DBSessionExercise } from "@/hooks/useStudentProgram";
import { EnhancedCompletedSet } from "@/components/student/EnhancedExerciseCard";
import EnhancedExerciseCard from "@/components/student/EnhancedExerciseCard";
import SessionSection from "@/components/student/SessionSection";
import SessionRecap from "@/components/student/SessionRecap";
import ProgressionTimeline, { ProgressionPhase } from "@/components/student/ProgressionTimeline";
import { ArrowLeft, Clock, User, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const LiveSession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { program, loading } = useStudentProgram();

  const [completedSets, setCompletedSets] = useState<Record<string, EnhancedCompletedSet[]>>({});
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [activeExerciseKey, setActiveExerciseKey] = useState<string>("0-0");
  const [showProgression, setShowProgression] = useState(false);

  // Find the session in the program
  const session: DBSession | null = useMemo(() => {
    if (!program) return null;
    for (const week of program.weeks) {
      for (const s of week.sessions) {
        if (s.id === sessionId) return s;
      }
    }
    // Fallback: return first session
    return program.weeks[0]?.sessions[0] || null;
  }, [program, sessionId]);

  const sections = session?.sections || [];
  const allExercises = useMemo(() =>
    sections.flatMap(s => s.exercises), [sections]);

  const progressionPhases: ProgressionPhase[] = useMemo(() =>
    (program?.progression || []).map(p => ({
      id: p.id,
      weekLabel: p.week_label,
      description: p.description,
      weekStart: p.week_start,
      weekEnd: p.week_end,
      isDeload: p.is_deload,
      order: p.sort_order,
    })), [program]);

  useEffect(() => {
    if (sessionDone) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, sessionDone]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const completedCount = Object.values(completedSets).filter(
    sets => sets.length > 0 && sets.every(s => s.reps > 0)
  ).length;

  const handleExerciseComplete = (key: string) => {
    const [sIdx, eIdx] = key.split("-").map(Number);
    let nextKey: string | null = null;
    for (let si = sIdx; si < sections.length; si++) {
      const startEi = si === sIdx ? eIdx + 1 : 0;
      for (let ei = startEi; ei < sections[si].exercises.length; ei++) {
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

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-8">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <p className="text-muted-foreground">Séance introuvable</p>
        <Button variant="ghost" onClick={() => navigate("/student")}>Retour</Button>
      </div>
    );
  }

  if (sessionDone) {
    // Build recap data compatible with SessionRecap
    const recapExercises = allExercises.map(ex => ({
      name: ex.exercise.name,
      sets: String(ex.sets),
      reps: ex.reps_min === ex.reps_max ? String(ex.reps_min) : `${ex.reps_min}-${ex.reps_max}`,
      tempo: ex.tempo || "",
      rest: ex.rest_seconds > 0 ? `${Math.floor(ex.rest_seconds / 60)}'${(ex.rest_seconds % 60).toString().padStart(2, "0")}"` : "—",
      rpe: ex.rpe_target || "",
      load: "",
      video: ex.video_url || "",
      channel: "",
      notes: ex.coach_notes || "",
    }));

    return (
      <div className="max-w-lg mx-auto">
        <SessionRecap
          exercises={recapExercises}
          completedSets={
            Object.fromEntries(
              Object.entries(completedSets).map(([key, sets]) => {
                let globalIdx = 0;
                const [sIdx, eIdx] = key.split("-").map(Number);
                for (let i = 0; i < sIdx; i++) globalIdx += sections[i].exercises.length;
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
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 -mx-4 px-4 pt-2 border-b border-border">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/student")}>
            <ArrowLeft className="w-4 h-4 mr-1" strokeWidth={1.5} />
            Quitter
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={showProgression ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowProgression(!showProgression)}
              className="gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} />
              Progression
            </Button>
            <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm font-bold tabular-nums">
                {mins}:{secs.toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <User className="w-4 h-4 text-accent-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{session.name}</p>
            <p className="text-[11px] text-muted-foreground">{program?.name}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {sections.length} blocs
          </Badge>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${allExercises.length > 0 ? (completedCount / allExercises.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
            {completedCount}/{allExercises.length}
          </span>
        </div>
      </div>

      {/* Progression panel */}
      {showProgression && progressionPhases.length > 0 && (
        <div className="glass p-4 animate-fade-in">
          <h3 className="font-bold text-sm mb-3">Plan de progression</h3>
          <ProgressionTimeline phases={progressionPhases} currentWeek={1} />
        </div>
      )}

      {/* Sections with exercises */}
      <div className="space-y-4">
        {sections.map((section, sIdx) => {
          const sectionHasActive = section.exercises.some(
            (_, eIdx) => `${sIdx}-${eIdx}` === activeExerciseKey
          );

          return (
            <SessionSection
              key={section.id}
              name={section.name}
              icon={section.icon}
              durationEstimate={section.duration_estimate || undefined}
              notes={section.notes || undefined}
              isActive={sectionHasActive}
            >
              {section.exercises.map((ex, eIdx) => {
                const key = `${sIdx}-${eIdx}`;
                const isActive = key === activeExerciseKey;
                const sets = completedSets[key] || [];

                return (
                  <div
                    key={ex.id}
                    onClick={() => !isActive && setActiveExerciseKey(key)}
                    className={cn(!isActive && "cursor-pointer")}
                  >
                    <EnhancedExerciseCard
                      name={ex.exercise.name}
                      sets={ex.sets}
                      repsMin={ex.reps_min}
                      repsMax={ex.reps_max}
                      restSeconds={ex.rest_seconds}
                      tempo={ex.tempo}
                      rpeTarget={ex.rpe_target}
                      suggestedWeight={ex.suggested_weight}
                      coachNotes={ex.coach_notes}
                      videoUrl={ex.video_url}
                      videoSearchQuery={ex.video_search_query}
                      isActive={isActive}
                      completedSets={sets}
                      onCompletedSetsChange={(newSets) =>
                        setCompletedSets(prev => ({ ...prev, [key]: newSets }))
                      }
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
