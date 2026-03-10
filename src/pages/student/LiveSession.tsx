import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { YANA_PROGRAM, ProgramExerciseDetail, ProgramSection } from "@/data/yana-program";
import { EXERCISE_ALTERNATIVES, AlternativeGroup } from "@/data/exercise-alternatives";
import { EnhancedCompletedSet } from "@/components/student/EnhancedExerciseCard";
import EnhancedExerciseCard from "@/components/student/EnhancedExerciseCard";
import SkipExerciseModal from "@/components/student/SkipExerciseModal";
import ExerciseAlternativesSheet from "@/components/student/ExerciseAlternativesSheet";
import SessionSection from "@/components/student/SessionSection";
import SessionRecap from "@/components/student/SessionRecap";
import ProgressionTimeline, { ProgressionPhase } from "@/components/student/ProgressionTimeline";
import { ArrowLeft, Clock, User, TrendingUp } from "lucide-react";
import ShareSessionButton from "@/components/student/ShareSessionButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentProgram } from "@/hooks/useStudentProgram";

interface Substitution {
  key: string;
  originalName: string;
  newName: string;
  newEquipment: string;
}

const LiveSession = () => {
  const navigate = useNavigate();
  const { sessionId: selectedSessionId } = useParams<{ sessionId: string }>();
  const { t } = useTranslation(['session', 'common']);
  const { user } = useAuth();
  const { program: dbProgram } = useStudentProgram();
  const [completedSets, setCompletedSets] = useState<Record<string, EnhancedCompletedSet[]>>({});
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [activeExerciseKey, setActiveExerciseKey] = useState<string>("0-0");
  const [showProgression, setShowProgression] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);
  const [swapTargetKey, setSwapTargetKey] = useState<string | null>(null);
  const [dynamicAlternatives, setDynamicAlternatives] = useState<AlternativeGroup | null>(null);
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(new Set());
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipTargetKey, setSkipTargetKey] = useState<string | null>(null);

  // Track which exercises' sets have been saved to DB
  const savedExercisesRef = useRef<Set<string>>(new Set());

  const selectedSessionId = (location.state as { sessionId?: string } | null)?.sessionId;

  const [freeSession, setFreeSession] = useState<any>(null);
  const [freeSessionLoading, setFreeSessionLoading] = useState(false);

  const programSession = useMemo(() => {
    const sessions = dbProgram?.weeks?.flatMap((w) => w.sessions) || [];
    if (sessions.length === 0) return null;
    return sessions.find((s) => s.id === selectedSessionId) || null;
  }, [dbProgram?.weeks, selectedSessionId]);

  // If not found in program, fetch as free session
  useEffect(() => {
    if (programSession || !selectedSessionId) return;
    setFreeSessionLoading(true);
    const fetchFree = async () => {
      const { data } = await supabase
        .from("sessions")
        .select(`
          id, name, day_of_week, notes, is_free_session, created_by,
          session_sections(id, name, sort_order, notes, duration_estimate, icon),
          session_exercises(
            id, sort_order, sets, reps_min, reps_max, rest_seconds, tempo,
            rpe_target, suggested_weight, coach_notes, video_url, video_search_query,
            section_id,
            exercise:exercises(id, name, name_en, muscle_group, equipment, type, tracking_type)
          )
        `)
        .eq("id", selectedSessionId)
        .maybeSingle();
      if (data) {
        // Shape it like a program session
        const sections = (data.session_sections || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((sec: any) => ({
            ...sec,
            exercises: (data.session_exercises || [])
              .filter((e: any) => e.section_id === sec.id)
              .sort((a: any, b: any) => a.sort_order - b.sort_order),
          }));
        // Exercises without a section
        const unsectioned = (data.session_exercises || [])
          .filter((e: any) => !e.section_id)
          .sort((a: any, b: any) => a.sort_order - b.sort_order);
        if (unsectioned.length > 0) {
          sections.push({ id: "default", name: "Exercices", sort_order: 999, notes: null, duration_estimate: null, icon: null, exercises: unsectioned });
        }
        setFreeSession({ ...data, sections });
      }
      setFreeSessionLoading(false);
    };
    fetchFree();
  }, [programSession, selectedSessionId]);

  const selectedSession = programSession || freeSession;

  // Map exercise keys to session_exercise IDs for DB persistence
  const sessionExerciseIdMap = useMemo(() => {
    if (!selectedSession) return {};
    const map: Record<string, string> = {};
    selectedSession.sections.forEach((section, sIdx) => {
      section.exercises.forEach((ex, eIdx) => {
        map[`${sIdx}-${eIdx}`] = ex.id;
      });
    });
    return map;
  }, [selectedSession]);

  // Build a map of exercise key -> tracking type from DB data
  const trackingTypeMap = useMemo(() => {
    if (!selectedSession) return {};
    const map: Record<string, string> = {};
    selectedSession.sections.forEach((section, sIdx) => {
      section.exercises.forEach((ex, eIdx) => {
        map[`${sIdx}-${eIdx}`] = (ex.exercise as any)?.tracking_type || "weight_reps";
      });
    });
    return map;
  }, [selectedSession]);

  const mappedSections = useMemo<ProgramSection[]>(() => {
    if (!selectedSession) return [];
    return selectedSession.sections.map((section) => ({
      name: section.name,
      duration: section.duration_estimate || "",
      notes: section.notes || "",
      exercises: section.exercises.map((ex) => ({
        name: ex.exercise?.name || "Exercice",
        sets: String(ex.sets ?? ""),
        reps: ex.reps_min === ex.reps_max ? String(ex.reps_min) : `${ex.reps_min}-${ex.reps_max}`,
        tempo: ex.tempo || "",
        rest: ex.rest_seconds ? String(ex.rest_seconds) : "—",
        rpe: ex.rpe_target || "",
        load: ex.suggested_weight ? `${ex.suggested_weight}kg` : "",
        video: ex.video_url || "",
        videoSearchQuery: ex.video_search_query || "",
        channel: "",
        notes: ex.coach_notes || "",
      })),
    }));
  }, [selectedSession]);

  const progressionPhases = useMemo<ProgressionPhase[]>(() => {
    const phases = dbProgram?.progression?.length
      ? dbProgram.progression.map((p) => ({
          id: p.id,
          weekLabel: p.week_label,
          description: p.description,
          weekStart: p.week_start,
          weekEnd: p.week_end,
          isDeload: p.is_deload,
          order: p.sort_order,
        }))
      : YANA_PROGRAM.progression.map((p, i) => {
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

    return phases;
  }, [dbProgram?.progression]);

  const sessionProgram = useMemo(() => {
    if (!selectedSession || mappedSections.length === 0) return YANA_PROGRAM;
    return {
      ...YANA_PROGRAM,
      title: selectedSession.name,
      sections: mappedSections,
      progression: progressionPhases.map((p) => `${p.weekLabel}: ${p.description}`),
    };
  }, [selectedSession, mappedSections, progressionPhases]);

  const getExerciseName = (sIdx: number, eIdx: number): string => {
    const key = `${sIdx}-${eIdx}`;
    const sub = substitutions.find(s => s.key === key);
    return sub ? sub.newName : sessionProgram.sections[sIdx]?.exercises[eIdx]?.name || "Exercice";
  };

  const allExercises: ProgramExerciseDetail[] = sessionProgram.sections.flatMap((s) => s.exercises);

  // Timer
  useEffect(() => {
    if (sessionDone) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, sessionDone]);

  // Create completed_session at mount (Bug 2 fix)
  useEffect(() => {
    if (!user || !selectedSession?.id || completedSessionId || sessionDone) return;
    const create = async () => {
      try {
        const { data, error } = await supabase.from("completed_sessions").insert({
          student_id: user.id,
          session_id: selectedSession.id,
          started_at: new Date(startTime).toISOString(),
        }).select("id").single();
        if (error) throw error;
        if (data) setCompletedSessionId(data.id);
      } catch (e) {
        console.error("Error creating completed session:", e);
      }
    };
    create();
  }, [user, selectedSession?.id, startTime, completedSessionId, sessionDone]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const completedCount = Object.entries(completedSets).filter(([key, sets]) => !skippedExercises.has(key) && sets.length > 0 && sets.every(s => s.reps > 0)).length;
  const skippedCount = skippedExercises.size;

  // Save sets for a given exercise key to DB
  const saveSetsForExercise = async (key: string) => {
    if (!completedSessionId) return;
    if (savedExercisesRef.current.has(key)) return;
    const sets = completedSets[key] || [];
    const sessionExId = sessionExerciseIdMap[key];
    if (!sessionExId) return;
    const rows = sets.filter(s => s.reps > 0).map(s => ({
      completed_session_id: completedSessionId,
      session_exercise_id: sessionExId,
      set_number: s.setNumber,
      weight: s.weight || null,
      reps: s.reps,
      rpe_actual: s.rpeActual,
      is_failure: s.isFailure,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from("completed_sets").insert(rows);
      if (error) {
        console.error("Error saving sets:", error);
      } else {
        savedExercisesRef.current.add(key);
      }
    }
  };

  const handleExerciseComplete = async (key: string) => {
    // Save sets for this exercise to DB
    await saveSetsForExercise(key);

    const [sIdx, eIdx] = key.split("-").map(Number);
    let nextKey: string | null = null;
    
    for (let si = sIdx; si < sessionProgram.sections.length; si++) {
      const startEi = si === sIdx ? eIdx + 1 : 0;
      for (let ei = startEi; ei < sessionProgram.sections[si].exercises.length; ei++) {
        nextKey = `${si}-${ei}`;
        break;
      }
      if (nextKey) break;
    }

    if (nextKey) {
      setActiveExerciseKey(nextKey);
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    setSessionDone(true);
    toast.success(t('session:session_done'));

    if (!completedSessionId) return;

    try {
      // Save any unsaved exercises' sets
      for (const key of Object.keys(completedSets)) {
        if (!skippedExercises.has(key)) {
          await saveSetsForExercise(key);
        }
      }

      // Update session with completion time
      await supabase.from("completed_sessions").update({
        completed_at: new Date().toISOString(),
        duration: elapsed,
      }).eq("id", completedSessionId);
    } catch (e) {
      console.error("Error finishing session:", e);
    }
  };

  const handleOpenSkip = (key: string) => {
    setSkipTargetKey(key);
    setSkipModalOpen(true);
  };

  const handleConfirmSkip = async (reason: string | null, reasonDetail: string | null) => {
    if (!skipTargetKey || !completedSessionId) return;
    const sessionExId = sessionExerciseIdMap[skipTargetKey];

    // Save to DB
    if (sessionExId) {
      await supabase.from("skipped_exercises").insert({
        completed_session_id: completedSessionId,
        session_exercise_id: sessionExId,
        reason,
        reason_detail: reasonDetail,
      });
    }

    setSkippedExercises(prev => new Set(prev).add(skipTargetKey));
    setSkipModalOpen(false);

    // Move to next exercise
    const [sIdx, eIdx] = skipTargetKey.split("-").map(Number);
    let nextKey: string | null = null;
    for (let si = sIdx; si < sessionProgram.sections.length; si++) {
      const startEi = si === sIdx ? eIdx + 1 : 0;
      for (let ei = startEi; ei < sessionProgram.sections[si].exercises.length; ei++) {
        const candidate = `${si}-${ei}`;
        if (!skippedExercises.has(candidate)) {
          nextKey = candidate;
          break;
        }
      }
      if (nextKey) break;
    }

    if (nextKey) {
      setActiveExerciseKey(nextKey);
    }
    setSkipTargetKey(null);
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

  // Bug 3 fix: fetch alternatives from DB if not in static map
  const handleOpenSwap = async (key: string) => {
    setSwapTargetKey(key);
    const [sIdx, eIdx] = key.split("-").map(Number);
    const exerciseName = sessionProgram.sections[sIdx]?.exercises[eIdx]?.name || "";

    // Check static alternatives first
    if (EXERCISE_ALTERNATIVES[exerciseName]) {
      setDynamicAlternatives(null);
      setSwapSheetOpen(true);
      return;
    }

    // Fetch from DB by muscle group
    const sessionEx = selectedSession?.sections[sIdx]?.exercises[eIdx];
    if (!sessionEx?.exercise) {
      setDynamicAlternatives(null);
      setSwapSheetOpen(true);
      return;
    }

    const muscleGroup = sessionEx.exercise.muscle_group;
    const { data: exercises } = await supabase
      .from("exercises")
      .select("name, equipment, muscle_group")
      .eq("muscle_group", muscleGroup)
      .neq("id", sessionEx.exercise_id)
      .eq("is_default", true)
      .limit(6);

    if (exercises && exercises.length > 0) {
      setDynamicAlternatives({
        muscleGroup,
        alternatives: exercises.map(e => ({
          name: e.name,
          equipment: e.equipment,
          difficulty: "medium" as const,
          reason: `Même groupe musculaire: ${muscleGroup}`,
        })),
      });
    } else {
      setDynamicAlternatives(null);
    }
    setSwapSheetOpen(true);
  };

  const handleSwapSelect = (alternative: { name: string; equipment: string }) => {
    if (!swapTargetKey) return;
    const [sIdx, eIdx] = swapTargetKey.split("-").map(Number);
    const originalName = sessionProgram.sections[sIdx]?.exercises[eIdx]?.name || "Exercice";

    setSubstitutions(prev => {
      const filtered = prev.filter(s => s.key !== swapTargetKey);
      return [...filtered, {
        key: swapTargetKey,
        originalName,
        newName: alternative.name,
        newEquipment: alternative.equipment,
      }];
    });

    // Clear completed sets for swapped exercise
    setCompletedSets(prev => {
      const updated = { ...prev };
      delete updated[swapTargetKey];
      return updated;
    });

    // Remove from saved so new sets can be saved
    savedExercisesRef.current.delete(swapTargetKey);

    toast.success(`${originalName} → ${alternative.name}`);
    setSwapSheetOpen(false);
    setSwapTargetKey(null);
  };

  const swapExerciseOriginalName = swapTargetKey
    ? sessionProgram.sections[parseInt(swapTargetKey.split("-")[0])]?.exercises[parseInt(swapTargetKey.split("-")[1])]?.name || ""
    : "";

  // Show loading while fetching free session
  if (freeSessionLoading || (!selectedSession && selectedSessionId)) {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t('common:loading')}</span>
        </div>
      </div>
    );
  }

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
                for (let i = 0; i < sIdx; i++) globalIdx += sessionProgram.sections[i].exercises.length;
                globalIdx += eIdx;
                return [globalIdx, sets.map(s => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps, isFailure: s.isFailure }))];
              })
            )
          }
          duration={elapsed}
          onClose={handleClose}
          completedSessionId={completedSessionId || undefined}
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
            <ShareSessionButton
              sessionId={selectedSession?.id || ""}
              completedSessionId={completedSessionId || undefined}
              sessionName={sessionProgram.title}
            />
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
            <p className="text-sm font-semibold truncate">{sessionProgram.title}</p>
            <p className="text-[11px] text-muted-foreground">{sessionProgram.client}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {sessionProgram.duration}
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
        {skippedCount > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
            <span>⏭ {t('session:exercises_skipped', { count: skippedCount })}</span>
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
        {sessionProgram.sections.map((section, sIdx) => {
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

                const isSkipped = skippedExercises.has(key);

                return (
                  <div
                    key={key}
                    onClick={() => !isActive && !isSkipped && setActiveExerciseKey(key)}
                    className={cn(!isActive && !isSkipped && "cursor-pointer")}
                  >
                    <EnhancedExerciseCard
                      name={displayName}
                      sets={targetSets}
                      repsMin={repsMin}
                      repsMax={repsMax}
                      restSeconds={restSeconds}
                      tempo={ex.tempo || null}
                      rpeTarget={ex.rpe || null}
                      suggestedWeight={ex.load ? parseFloat(ex.load) || null : null}
                      coachNotes={ex.notes || null}
                      videoUrl={ex.video || null}
                      videoSearchQuery={ex.videoSearchQuery || ex.name || null}
                      isActive={isActive}
                      completedSets={sets}
                      onCompletedSetsChange={(newSets) => setCompletedSets(prev => ({ ...prev, [key]: newSets }))}
                      onAllSetsComplete={() => handleExerciseComplete(key)}
                      onSwapExercise={() => handleOpenSwap(key)}
                      onSkipExercise={() => handleOpenSkip(key)}
                      isSubstituted={isSubstituted}
                      isSkipped={isSkipped}
                      trackingType={(trackingTypeMap[key] as any) || "weight_reps"}
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
          onClick={() => finishSession()}
          disabled={completedCount === 0}
        >
          {t('session:finish_session', { completed: completedCount, total: allExercises.length })}
        </Button>
      </div>

      <ExerciseAlternativesSheet
        open={swapSheetOpen}
        onClose={() => { setSwapSheetOpen(false); setSwapTargetKey(null); }}
        exerciseName={swapExerciseOriginalName}
        group={EXERCISE_ALTERNATIVES[swapExerciseOriginalName] || dynamicAlternatives}
        onSelect={handleSwapSelect}
      />

      <SkipExerciseModal
        open={skipModalOpen}
        onClose={() => { setSkipModalOpen(false); setSkipTargetKey(null); }}
        onConfirm={handleConfirmSkip}
        exerciseName={skipTargetKey ? getExerciseName(...skipTargetKey.split("-").map(Number) as [number, number]) : ""}
      />
    </div>
  );
};

export default LiveSession;
