import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { YANA_PROGRAM, ProgramExerciseDetail } from "@/data/yana-program";
import { EXERCISE_ALTERNATIVES } from "@/data/exercise-alternatives";
import { EnhancedCompletedSet } from "@/components/student/EnhancedExerciseCard";
import EnhancedExerciseCard from "@/components/student/EnhancedExerciseCard";
import ExerciseAlternativesSheet from "@/components/student/ExerciseAlternativesSheet";
import SessionSection from "@/components/student/SessionSection";
import SessionRecap from "@/components/student/SessionRecap";
import ProgressionTimeline, { ProgressionPhase } from "@/components/student/ProgressionTimeline";
import { ArrowLeft, Clock, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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

interface Substitution {
  key: string;
  originalName: string;
  newName: string;
  newEquipment: string;
}

const LiveSession = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['session', 'common']);
  const [completedSets, setCompletedSets] = useState<Record<string, EnhancedCompletedSet[]>>({});
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [activeExerciseKey, setActiveExerciseKey] = useState<string>("0-0");
  const [showProgression, setShowProgression] = useState(false);

  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);
  const [swapTargetKey, setSwapTargetKey] = useState<string | null>(null);

  const getExerciseName = (sIdx: number, eIdx: number): string => {
    const key = `${sIdx}-${eIdx}`;
    const sub = substitutions.find(s => s.key === key);
    return sub ? sub.newName : YANA_PROGRAM.sections[sIdx].exercises[eIdx].name;
  };

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

  const completedCount = Object.values(completedSets).filter(sets => sets.length > 0 && sets.every(s => s.reps > 0)).length;

  const handleExerciseComplete = (key: string) => {
    const [sIdx, eIdx] = key.split("-").map(Number);
    let nextKey: string | null = null;
    
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
      toast.success(t('session:session_done'));
    }
  };

  const handleClose = () => {
    const sessionData = {
      date: new Date().toISOString(),
      duration: elapsed,
      completedSets,
      substitutions,
      exerciseCount: allExercises.length,
      completedCount,
    };
    const history = JSON.parse(localStorage.getItem("session_history") || "[]");
    history.push(sessionData);
    localStorage.setItem("session_history", JSON.stringify(history));

    toast.success(t('session:session_saved'));
    navigate("/student");
  };

  const handleOpenSwap = (key: string) => {
    setSwapTargetKey(key);
    setSwapSheetOpen(true);
  };

  const handleSwapSelect = (alternative: { name: string; equipment: string }) => {
    if (!swapTargetKey) return;
    const [sIdx, eIdx] = swapTargetKey.split("-").map(Number);
    const originalName = YANA_PROGRAM.sections[sIdx].exercises[eIdx].name;

    setSubstitutions(prev => {
      const filtered = prev.filter(s => s.key !== swapTargetKey);
      return [...filtered, {
        key: swapTargetKey,
        originalName,
        newName: alternative.name,
        newEquipment: alternative.equipment,
      }];
    });

    setCompletedSets(prev => {
      const updated = { ...prev };
      delete updated[swapTargetKey];
      return updated;
    });

    toast.success(`${originalName} → ${alternative.name}`);
    setSwapSheetOpen(false);
    setSwapTargetKey(null);
  };

  const swapExerciseOriginalName = swapTargetKey
    ? YANA_PROGRAM.sections[parseInt(swapTargetKey.split("-")[0])].exercises[parseInt(swapTargetKey.split("-")[1])].name
    : "";

  if (sessionDone) {
    return (
      <div className="max-w-lg mx-auto">
        <SessionRecap
          exercises={allExercises}
          completedSets={
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
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 -mx-4 px-4 pt-2 border-b border-border">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/student")}>
            <ArrowLeft className="w-4 h-4 mr-1" strokeWidth={1.5} />
            {t('session:quit')}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={showProgression ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowProgression(!showProgression)}
              className="gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t('session:progression')}
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
            <p className="text-sm font-semibold truncate">{YANA_PROGRAM.title}</p>
            <p className="text-[11px] text-muted-foreground">{YANA_PROGRAM.client}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {YANA_PROGRAM.duration}
          </Badge>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / allExercises.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
            {completedCount}/{allExercises.length}
          </span>
        </div>

        {substitutions.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-warning font-medium">
            <span>⚡ {substitutions.length > 1 ? t('session:exercises_modified_plural', { count: substitutions.length }) : t('session:exercises_modified', { count: substitutions.length })}</span>
          </div>
        )}
      </div>

      {showProgression && (
        <div className="glass p-4 animate-fade-in">
          <h3 className="font-bold text-sm mb-3">{t('session:progression_plan')}</h3>
          <ProgressionTimeline phases={progressionPhases} currentWeek={1} />
        </div>
      )}

      <div className="space-y-4">
        {YANA_PROGRAM.sections.map((section, sIdx) => {
          const sectionHasActive = section.exercises.some((_, eIdx) => `${sIdx}-${eIdx}` === activeExerciseKey);

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
                const displayName = getExerciseName(sIdx, eIdx);
                const isSubstituted = substitutions.some(s => s.key === key);
                const hasAlternatives = !!EXERCISE_ALTERNATIVES[ex.name];

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
                      name={displayName}
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
                      onSwapExercise={() => handleOpenSwap(key)}
                      hasAlternatives={hasAlternatives}
                      isSubstituted={isSubstituted}
                    />
                  </div>
                );
              })}
            </SessionSection>
          );
        })}
      </div>

      <div className="py-4">
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={() => { setSessionDone(true); toast.success(t('session:session_done')); }}
          disabled={completedCount === 0}
        >
          {t('session:finish_session', { completed: completedCount, total: allExercises.length })}
        </Button>
      </div>

      <ExerciseAlternativesSheet
        open={swapSheetOpen}
        onClose={() => { setSwapSheetOpen(false); setSwapTargetKey(null); }}
        exerciseName={swapExerciseOriginalName}
        group={EXERCISE_ALTERNATIVES[swapExerciseOriginalName] || null}
        onSelect={handleSwapSelect}
      />
    </div>
  );
};

export default LiveSession;