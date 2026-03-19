import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ProgramExerciseDetail, ProgramSection } from "@/data/yana-program";
import { EXERCISE_ALTERNATIVES, AlternativeGroup } from "@/data/exercise-alternatives";
import ExercisePicker from "@/components/coach/ExercisePicker";
import { Exercise } from "@/types/exercise";
import { EnhancedCompletedSet } from "@/components/student/EnhancedExerciseCard";
import EnhancedExerciseCard from "@/components/student/EnhancedExerciseCard";
import SkipExerciseModal from "@/components/student/SkipExerciseModal";
import ExerciseAlternativesSheet from "@/components/student/ExerciseAlternativesSheet";
import SessionSection from "@/components/student/SessionSection";
import SessionRecap from "@/components/student/SessionRecap";
import ProgressionTimeline, { ProgressionPhase } from "@/components/student/ProgressionTimeline";
import WorkoutStatsBar from "@/components/student/WorkoutStatsBar";
import NextExercisePreview from "@/components/student/NextExercisePreview";
import ShareSessionButton from "@/components/student/ShareSessionButton";
import { Clock, Plus, CloudOff } from "lucide-react";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentProgram } from "@/hooks/useStudentProgram";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

interface Substitution {
  key: string;
  originalName: string;
  newName: string;
  newEquipment: string;
}

const LiveSession = () => {
  const navigate = useNavigate();
  const { sessionId: selectedSessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['session', 'common']);
  const { user } = useAuth();
  const { program: dbProgram, loading: programLoading } = useStudentProgram();
  const isAdvanced = useIsAdvanced();
  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;

  const [completedSets, setCompletedSets] = useState<Record<string, EnhancedCompletedSet[]>>({});
  const [sessionDone, setSessionDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [finishError, setFinishError] = useState(false);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasStartedWorkout, setHasStartedWorkout] = useState(false);
  
  const [freeSession, setFreeSession] = useState<any>(null);
  const [freeSessionLoading, setFreeSessionLoading] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [addToSectionIdx, setAddToSectionIdx] = useState<number>(0);

  // Apply dark theme on mount for immersive workout
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.style.backgroundColor = "#09090b";
    return () => {
      // Restore theme on unmount — ThemeContext will handle it
      document.body.style.backgroundColor = "";
    };
  }, []);

  const programSession = useMemo(() => {
    const sessions = dbProgram?.weeks?.flatMap((w) => w.sessions) || [];
    return sessions.find((s) => s.id === selectedSessionId) || null;
  }, [dbProgram?.weeks, selectedSessionId]);

  useEffect(() => {
    // Wait for program to finish loading before deciding to fetch as free/fallback session
    if (programLoading || programSession || !selectedSessionId) {
      if (programSession) setFreeSessionLoading(false);
      return;
    }
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
            exercise:exercises(id, name, name_en, muscle_group, equipment, type, tracking_type, video_url_female, video_url_male)
          )
        `)
        .eq("id", selectedSessionId)
        .maybeSingle();
      if (data) {
        const sections = (data.session_sections || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((sec: any) => ({
            ...sec,
            exercises: (data.session_exercises || [])
              .filter((e: any) => e.section_id === sec.id)
              .sort((a: any, b: any) => a.sort_order - b.sort_order),
          }));
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
  }, [programLoading, programSession, selectedSessionId]);

  const selectedSession = programSession || freeSession;

  const sessionExerciseIdMap = useMemo(() => {
    if (!selectedSession) return {};
    const map: Record<string, string> = {};
    selectedSession.sections.forEach((section: any, sIdx: number) => {
      section.exercises.forEach((ex: any, eIdx: number) => {
        map[`${sIdx}-${eIdx}`] = ex.id;
      });
    });
    return map;
  }, [selectedSession]);

  const trackingTypeMap = useMemo(() => {
    if (!selectedSession) return {};
    const map: Record<string, string> = {};
    selectedSession.sections.forEach((section: any, sIdx: number) => {
      section.exercises.forEach((ex: any, eIdx: number) => {
        map[`${sIdx}-${eIdx}`] = (ex.exercise as any)?.tracking_type || "weight_reps";
      });
    });
    return map;
  }, [selectedSession]);

  const mappedSections = useMemo<ProgramSection[]>(() => {
    if (!selectedSession) return [];
    return selectedSession.sections.map((section: any) => ({
      name: section.name,
      duration: section.duration_estimate || "",
      notes: section.notes || "",
      exercises: section.exercises.map((ex: any) => ({
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
        videoUrlFemale: (ex.exercise as any)?.video_url_female || "",
        videoUrlMale: (ex.exercise as any)?.video_url_male || "",
        exerciseVideoUrl: (ex.exercise as any)?.video_url || "",
      })),
    }));
  }, [selectedSession]);

  const progressionPhases = useMemo<ProgressionPhase[]>(() => {
    return (dbProgram?.progression || []).map((p: any) => ({
      id: p.id, weekLabel: p.week_label, description: p.description,
      weekStart: p.week_start, weekEnd: p.week_end, isDeload: p.is_deload, order: p.sort_order,
    }));
  }, [dbProgram?.progression]);

  const sessionProgram = useMemo(() => ({
    title: selectedSession?.name || "Séance",
    sections: mappedSections,
    progression: progressionPhases.map((p) => `${p.weekLabel}: ${p.description}`),
  }), [selectedSession, mappedSections, progressionPhases]);

  const getExerciseName = (sIdx: number, eIdx: number): string => {
    const key = `${sIdx}-${eIdx}`;
    const sub = substitutions.find(s => s.key === key);
    return sub ? sub.newName : sessionProgram.sections[sIdx]?.exercises[eIdx]?.name || "Exercice";
  };

  const allExercises: ProgramExerciseDetail[] = sessionProgram.sections.flatMap((s) => s.exercises);

  // Timer
  useEffect(() => {
    if (sessionDone) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime, sessionDone]);

  // Create completed_session at mount
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
        toast.error(t("session:session_create_failed"));
      }
    };
    create();
  }, [user, selectedSession?.id, startTime, completedSessionId, sessionDone]);

  const completedCount = Object.entries(completedSets).filter(([key, sets]) => !skippedExercises.has(key) && sets.length > 0 && sets.every(s => s.reps > 0)).length;
  const skippedCount = skippedExercises.size;

  const saveSetsForExercise = async (key: string): Promise<boolean> => {
    if (!completedSessionId) return false;
    const sets = completedSets[key] || [];
    const sessionExId = sessionExerciseIdMap[key];
    if (!sessionExId) return false;
    const rows = sets.filter(s => s.reps > 0).map(s => ({
      completed_session_id: completedSessionId,
      session_exercise_id: sessionExId,
      set_number: s.setNumber,
      weight: s.weight || null,
      reps: s.reps,
      rpe_actual: s.rpeActual,
      is_failure: s.isFailure,
    }));
    // Delete existing rows then re-insert to handle updates
    const { error: delError } = await supabase.from("completed_sets")
      .delete()
      .eq("completed_session_id", completedSessionId)
      .eq("session_exercise_id", sessionExId);
    if (delError) { console.error("Error deleting sets:", delError); return false; }
    if (rows.length > 0) {
      const { error } = await supabase.from("completed_sets").insert(rows);
      if (error) { console.error("Error saving sets:", error); return false; }
    }
    return true;
  };

  // Auto-save sets with debounce whenever completedSets change
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!completedSessionId || Object.keys(completedSets).length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      let allOk = true;
      for (const key of Object.keys(completedSets)) {
        if (!skippedExercises.has(key)) {
          const ok = await saveSetsForExercise(key);
          if (!ok) allOk = false;
        }
      }
      if (allOk) {
        setSaveStatus("saved");
      } else {
        // First failure — toast + retry once after 3s
        toast.error(t("session:save_failed"));
        setSaveStatus("error");
        await new Promise(r => setTimeout(r, 3000));
        setSaveStatus("saving");
        let retryOk = true;
        for (const key of Object.keys(completedSets)) {
          if (!skippedExercises.has(key)) {
            const ok = await saveSetsForExercise(key);
            if (!ok) retryOk = false;
          }
        }
        if (retryOk) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
          toast.error(t("session:save_failed_final"));
        }
      }
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [completedSets, completedSessionId]);

  // Find next exercise key from current
  const getNextExerciseKey = useCallback((fromKey: string): string | null => {
    const [sIdx, eIdx] = fromKey.split("-").map(Number);
    for (let si = sIdx; si < sessionProgram.sections.length; si++) {
      const startEi = si === sIdx ? eIdx + 1 : 0;
      for (let ei = startEi; ei < sessionProgram.sections[si].exercises.length; ei++) {
        const candidate = `${si}-${ei}`;
        if (!skippedExercises.has(candidate)) return candidate;
      }
    }
    return null;
  }, [sessionProgram.sections, skippedExercises]);

  // Next exercise info for preview
  const nextExerciseInfo = useMemo(() => {
    const nextKey = getNextExerciseKey(activeExerciseKey);
    if (!nextKey) return null;
    const [sIdx, eIdx] = nextKey.split("-").map(Number);
    const ex = sessionProgram.sections[sIdx]?.exercises[eIdx];
    if (!ex) return null;
    return { name: getExerciseName(sIdx, eIdx), sets: ex.sets, reps: ex.reps };
  }, [activeExerciseKey, sessionProgram.sections, getNextExerciseKey]);

  const handleExerciseComplete = async (key: string) => {
    if (isSaving) return;
    if (!hasStartedWorkout) setHasStartedWorkout(true);
    await saveSetsForExercise(key);
    const nextKey = getNextExerciseKey(key);
    if (nextKey) {
      setActiveExerciseKey(nextKey);
    } else {
      setIsSaving(true);
      try {
        await finishSession();
      } finally {
        setIsSaving(false);
      }
    }
  };

  const finishSession = async () => {
    setSessionDone(true);

    // Confetti burst
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"] });
      setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 } }), 300);
    } catch {}

    // Vibrate celebration
    try { navigator.vibrate?.([100, 50, 100, 50, 200]); } catch {}

    toast.success(t('session:session_done'));
    if (!completedSessionId) return;

    try {
      for (const key of Object.keys(completedSets)) {
        if (!skippedExercises.has(key)) await saveSetsForExercise(key);
      }
      await supabase.from("completed_sessions").update({
        completed_at: new Date().toISOString(),
        duration: elapsed,
      }).eq("id", completedSessionId);
    } catch (e) { console.error("Error finishing session:", e); }
  };

  const handleOpenSkip = (key: string) => { setSkipTargetKey(key); setSkipModalOpen(true); };

  const handleConfirmSkip = async (reason: string | null, reasonDetail: string | null) => {
    if (!skipTargetKey || !completedSessionId) return;
    const sessionExId = sessionExerciseIdMap[skipTargetKey];
    if (sessionExId) {
      await supabase.from("skipped_exercises").insert({
        completed_session_id: completedSessionId,
        session_exercise_id: sessionExId,
        reason, reason_detail: reasonDetail,
      });
    }
    setSkippedExercises(prev => new Set(prev).add(skipTargetKey));
    setSkipModalOpen(false);
    const nextKey = getNextExerciseKey(skipTargetKey);
    if (nextKey) setActiveExerciseKey(nextKey);
    setSkipTargetKey(null);
  };

  const handleClose = () => {
    const sessionData = {
      date: new Date().toISOString(), duration: elapsed, completedSets,
      substitutions, exerciseCount: allExercises.length, completedCount,
    };
    const history = JSON.parse(localStorage.getItem("session_history") || "[]");
    history.push(sessionData);
    localStorage.setItem("session_history", JSON.stringify(history));
    toast.success(t('session:session_saved'));
    navigate("/student");
  };

  const handleDeleteSession = async () => {
    if (!user || !selectedSession || !studentId) return;
    // Delete any completed session records first
    await supabase.from("completed_sessions").delete()
      .eq("student_id", studentId).eq("session_id", selectedSession.id);
    const sessionName = selectedSession.name;
    const { data: updatedSession, error } = await supabase
      .from("sessions").update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq("id", selectedSession.id).eq("is_deleted", false).select("id").maybeSingle();
    if (error) { toast.error(t("common:error")); return; }
    if (!updatedSession) { toast.error(t("session:session_already_completed")); return; }
    await queryClient.invalidateQueries({ queryKey: ["student-program"] });
    if ((selectedSession as any).is_free_session) await queryClient.invalidateQueries({ queryKey: ["week-free-sessions"] });
    toast.success(t("session:session_deleted"));

    const { data: coachRow } = await supabase.from("coach_students")
      .select("coach_id").eq("student_id", studentId).eq("status", "active").maybeSingle();
    if (coachRow?.coach_id) {
      const { data: profile } = await supabase.from("profiles")
        .select("full_name").eq("user_id", studentId).maybeSingle();
      const athleteName = profile?.full_name || user.email?.split("@")[0] || "Athlète";
      await supabase.from("coach_notifications").insert({
        coach_id: coachRow.coach_id, student_id: studentId,
        message: JSON.stringify({ key: "session_deleted_by_athlete", athlete: athleteName, session: sessionName }),
      });
    }
    setDeleteDialogOpen(false);
    navigate("/student");
  };

  const handleOpenSwap = async (key: string) => {
    setSwapTargetKey(key);
    const [sIdx, eIdx] = key.split("-").map(Number);
    const exerciseName = sessionProgram.sections[sIdx]?.exercises[eIdx]?.name || "";
    if (EXERCISE_ALTERNATIVES[exerciseName]) { setDynamicAlternatives(null); setSwapSheetOpen(true); return; }
    const sessionEx = selectedSession?.sections[sIdx]?.exercises[eIdx];
    if (!sessionEx?.exercise) { setDynamicAlternatives(null); setSwapSheetOpen(true); return; }
    const muscleGroup = sessionEx.exercise.muscle_group;
    const { data: exercises } = await supabase.from("exercises")
      .select("name, equipment, muscle_group").eq("muscle_group", muscleGroup)
      .neq("id", sessionEx.exercise_id).eq("is_default", true).limit(6);
    if (exercises && exercises.length > 0) {
      setDynamicAlternatives({
        muscleGroup,
        alternatives: exercises.map(e => ({ name: e.name, equipment: e.equipment, difficulty: "medium" as const, reason: t('session:same_muscle_group', { muscleGroup }) })),
      });
    } else { setDynamicAlternatives(null); }
    setSwapSheetOpen(true);
  };

  const handleSwapSelect = (alternative: { name: string; equipment: string }) => {
    if (!swapTargetKey) return;
    const [sIdx, eIdx] = swapTargetKey.split("-").map(Number);
    const originalName = sessionProgram.sections[sIdx]?.exercises[eIdx]?.name || "Exercice";
    setSubstitutions(prev => [...prev.filter(s => s.key !== swapTargetKey), { key: swapTargetKey, originalName, newName: alternative.name, newEquipment: alternative.equipment }]);
    setCompletedSets(prev => { const u = { ...prev }; delete u[swapTargetKey]; return u; });
    
    toast.success(`${originalName} → ${alternative.name}`);
    setSwapSheetOpen(false);
    setSwapTargetKey(null);
  };

  const handleAddExercise = async (exercise: Exercise) => {
    if (!selectedSession?.id) return;
    // Determine section to add to
    const targetSection = selectedSession.sections[addToSectionIdx];
    const sectionId = targetSection?.id && targetSection.id !== "default" ? targetSection.id : null;
    const existingExCount = targetSection?.exercises?.length || 0;

    // Insert into DB
    const { data: newRow, error } = await supabase.from("session_exercises").insert({
      session_id: selectedSession.id,
      exercise_id: exercise.id,
      section_id: sectionId,
      sort_order: existingExCount,
      sets: 3,
      reps_min: 10,
      reps_max: 12,
      rest_seconds: 90,
    }).select("id").single();

    if (error) {
      console.error("Error adding exercise:", error);
      toast.error(t("common:error"));
      return;
    }

    // Update local session data
    const newExercise = {
      id: newRow.id,
      exercise_id: exercise.id,
      sort_order: existingExCount,
      sets: 3,
      reps_min: 10,
      reps_max: 12,
      rest_seconds: 90,
      tempo: null,
      rpe_target: null,
      suggested_weight: null,
      coach_notes: null,
      video_url: null,
      video_search_query: null,
      section_id: sectionId,
      exercise: {
        id: exercise.id,
        name: exercise.name,
        name_en: exercise.name_en || null,
        muscle_group: exercise.muscle_group,
        equipment: exercise.equipment,
        type: exercise.type,
        tracking_type: exercise.tracking_type || "weight_reps",
        video_url_female: exercise.video_url_female || null,
        video_url_male: exercise.video_url_male || null,
      },
    };

    // Update the session object (works for both program and free sessions)
    const updateSession = (session: any) => {
      const updated = { ...session, sections: session.sections.map((sec: any, idx: number) => {
        if (idx === addToSectionIdx) {
          return { ...sec, exercises: [...sec.exercises, newExercise] };
        }
        return sec;
      })};
      return updated;
    };

    if (freeSession) {
      setFreeSession(updateSession(freeSession));
    } else if (programSession) {
      // For program sessions, invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ["student-program"] });
    }

    toast.success(t("session:exercise_added", { name: exercise.name, defaultValue: `${exercise.name} ajouté` }));
  };

  const swapExerciseOriginalName = swapTargetKey
    ? sessionProgram.sections[parseInt(swapTargetKey.split("-")[0])]?.exercises[parseInt(swapTargetKey.split("-")[1])]?.name || ""
    : "";

  // Loading — wait for both program and free session fetch to complete
  if (programLoading || freeSessionLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-400">
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t('common:loading')}</span>
        </div>
      </div>
    );
  }

  // Session not found — past session or deleted
  if (!selectedSession && selectedSessionId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Clock className="w-8 h-8 text-zinc-500" />
        <p className="text-zinc-300 font-semibold">{t('session:session_not_found', 'Séance introuvable')}</p>
        <p className="text-zinc-500 text-sm max-w-xs">
          {t('session:session_not_found_desc', 'Cette séance a peut-être été supprimée ou appartient à un programme précédent.')}
        </p>
        <Button variant="outline" onClick={() => navigate("/student")} className="mt-2">
          {t('common:back_to_app', 'Retour')}
        </Button>
      </div>
    );
  }

  // Session complete recap
  if (sessionDone) {
    return (
      <div className="max-w-2xl mx-auto p-4">
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
    <div className="min-h-screen bg-zinc-950 -m-4 md:-m-8">
      {/* Immersive stats bar */}
      <WorkoutStatsBar
        elapsed={elapsed}
        completedSets={completedSets}
        totalExercises={allExercises.length}
        completedExerciseCount={completedCount}
        sessionTitle={sessionProgram.title}
        onBack={() => navigate("/student")}
        onProgression={() => setShowProgression(!showProgression)}
        showProgression={showProgression}
        showDelete={!hasStartedWorkout}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      {/* Content */}
      <div className="max-w-2xl mx-auto px-3 py-4 space-y-3 pb-32">
        {/* Substitution + skip notices (Advanced only) */}
        <AnimatePresence>
          {isAdvanced && substitutions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 text-xs text-amber-400 font-medium px-1"
            >
              <span>⚡ {substitutions.length} {t('session:exercises_modified', { count: substitutions.length })}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {skippedCount > 0 && (
          <p className="text-xs text-zinc-500 font-medium px-1">
            ⏭ {t('session:exercises_skipped', { count: skippedCount })}
          </p>
        )}

        {/* Progression timeline (Advanced) */}
        <AnimatePresence>
          {showProgression && isAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <h3 className="font-bold text-sm mb-3 text-zinc-200">{t('session:progression_plan')}</h3>
              <ProgressionTimeline phases={progressionPhases} currentWeek={1} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exercise sections */}
        <div className="space-y-3">
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
                    <motion.div
                      key={key}
                      layout
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      role={!isActive && !isSkipped ? "button" : undefined}
                      tabIndex={!isActive && !isSkipped ? 0 : undefined}
                      onClick={() => !isActive && !isSkipped && setActiveExerciseKey(key)}
                      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isActive && !isSkipped) { e.preventDefault(); setActiveExerciseKey(key); } }}
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
                        videoUrlFemale={ex.videoUrlFemale || null}
                        videoUrlMale={ex.videoUrlMale || null}
                        exerciseVideoUrl={ex.exerciseVideoUrl || null}
                        isActive={isActive}
                        completedSets={sets}
                        onCompletedSetsChange={(newSets) => setCompletedSets(prev => ({ ...prev, [key]: newSets }))}
                        onAllSetsComplete={() => handleExerciseComplete(key)}
                        onSwapExercise={() => handleOpenSwap(key)}
                        onSkipExercise={() => handleOpenSkip(key)}
                        isSubstituted={isSubstituted}
                        isSkipped={isSkipped}
                        trackingType={(trackingTypeMap[key] as any) || "weight_reps"}
                        sessionExerciseId={sessionExerciseIdMap[key]}
                        completedSessionId={completedSessionId || undefined}
                      />
                    </motion.div>
                  );
                })}
              </SessionSection>
            );
          })}

          {/* Add exercise button */}
          <Button
            variant="outline"
            className="w-full border-dashed border-border text-muted-foreground hover:text-foreground"
            onClick={() => {
              // Default to last section
              setAddToSectionIdx(sessionProgram.sections.length > 0 ? sessionProgram.sections.length - 1 : 0);
              setExercisePickerOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("session:add_exercise", { defaultValue: "Ajouter un exercice" })}
          </Button>
        </div>

        {/* Finish button */}
        <div className="py-4">
          <Button
            className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90"
            onClick={() => finishSession()}
            disabled={completedCount === 0}
          >
            {t('session:finish_session', { completed: completedCount, total: allExercises.length })}
          </Button>
        </div>
      </div>

      {/* Next exercise preview (Simple mode — always visible) */}
      {!isAdvanced && nextExerciseInfo && (
        <NextExercisePreview
          name={nextExerciseInfo.name}
          sets={nextExerciseInfo.sets}
          reps={nextExerciseInfo.reps}
        />
      )}

      {/* Share button */}
      <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-20 right-4 z-20">
        <ShareSessionButton
          sessionId={selectedSession?.id || ""}
          completedSessionId={completedSessionId || undefined}
          sessionName={sessionProgram.title}
        />
      </div>

      {/* Modals */}
      <ExercisePicker
        open={exercisePickerOpen}
        onClose={() => setExercisePickerOpen(false)}
        onSelect={handleAddExercise}
      />
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('session:delete_session_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('session:delete_session_desc', { name: selectedSession?.name || '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('session:delete_session_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LiveSession;
