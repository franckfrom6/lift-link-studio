import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ProgramExerciseDetail, ProgramSection } from "@/data/yana-program";
import { EXERCISE_ALTERNATIVES, AlternativeGroup } from "@/data/exercise-alternatives";
import ExercisePicker from "@/components/coach/ExercisePicker";
import { Exercise } from "@/types/exercise";
import { EnhancedCompletedSet } from "@/components/student/EnhancedExerciseCard";
import EnhancedExerciseCard from "@/components/student/EnhancedExerciseCard";
import LinearRestTimer from "@/components/student/LinearRestTimer";
import SkipExerciseModal from "@/components/student/SkipExerciseModal";
import ExerciseAlternativesSheet from "@/components/student/ExerciseAlternativesSheet";
import SessionSection from "@/components/student/SessionSection";
import SessionRecap from "@/components/student/SessionRecap";
import ProgressionTimeline, { ProgressionPhase } from "@/components/student/ProgressionTimeline";
import WorkoutStatsBar from "@/components/student/WorkoutStatsBar";
import NextExercisePreview from "@/components/student/NextExercisePreview";
import ShareSessionButton from "@/components/student/ShareSessionButton";
import BiSetToggle from "@/components/coach/BiSetToggle";
import { Clock, Plus, CloudOff, Loader2 } from "lucide-react";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
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
import { isLinkedToNext } from "@/lib/superset-utils";

interface Substitution {
  key: string;
  originalName: string;
  newName: string;
  newEquipment: string;
}

function readSessionBackup(sessionId: string | undefined) {
  if (!sessionId) return null;
  try {
    const raw = localStorage.getItem('live_session_backup');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const age = Date.now() - new Date(parsed.date ?? 0).getTime();
    if (parsed.sessionId !== sessionId || age > 4 * 60 * 60 * 1000) {
      localStorage.removeItem('live_session_backup');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const _backup = useMemo(() => readSessionBackup(selectedSessionId), []);

  const [completedSets, setCompletedSets] = useState<Record<string, EnhancedCompletedSet[]>>(
    () => _backup?.completedSets ?? {}
  );
  const [sessionDone, setSessionDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [finishError, setFinishError] = useState(false);
  const [startTime, setStartTime] = useState<number>(() => {
    if (_backup?.startTime) return _backup.startTime;
    const saved = localStorage.getItem("ls_start_time");
    return saved ? parseInt(saved, 10) : Date.now();
  });
  const [elapsed, setElapsed] = useState(0);
  const LS_ACTIVE_KEY = `ls_active_${selectedSessionId}`;
  const [activeExerciseKey, setActiveExerciseKeyState] = useState<string>(() => {
    if (!selectedSessionId) return "0-0";
    return localStorage.getItem(LS_ACTIVE_KEY) ?? "0-0";
  });
  const setActiveExercise = useCallback((key: string) => {
    localStorage.setItem(LS_ACTIVE_KEY, key);
    setActiveExerciseKeyState(key);
  }, [LS_ACTIVE_KEY]);
  const [globalRestSeconds, setGlobalRestSeconds] = useState<number | null>(() => {
    if (!_backup?.restEndTime) return null;
    const remaining = Math.ceil((_backup.restEndTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : null;
  });
  const [showProgression, setShowProgression] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [substitutions, setSubstitutions] = useState<Substitution[]>(
    () => _backup?.substitutions ?? []
  );
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);
  const [swapTargetKey, setSwapTargetKey] = useState<string | null>(null);
  const [swapSelectedName, setSwapSelectedName] = useState<string | null>(null);
  const [dynamicAlternatives, setDynamicAlternatives] = useState<AlternativeGroup | null>(null);
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(
    () => new Set(_backup?.skippedExercises ?? [])
  );
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipTargetKey, setSkipTargetKey] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasStartedWorkout, setHasStartedWorkout] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  
  const [freeSession, setFreeSession] = useState<any>(null);
  const [freeSessionLoading, setFreeSessionLoading] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [addToSectionIdx, setAddToSectionIdx] = useState<number>(0);

  // Refs for the bottom-fixed elements so we can measure their combined
  // height and reserve matching padding on the scroll container. This
  // prevents the sticky "À SUIVRE" / Share button from covering the last
  // exercise's sets/validate buttons.
  const nextPreviewRef = useRef<HTMLDivElement | null>(null);
  const shareBtnRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);
  const isHydratingRef = useRef(false);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const update = () => {
      const previewH = nextPreviewRef.current?.offsetHeight ?? 0;
      // Bottom nav (mobile) is 64px (h-16). Add 16px breathing room.
      const navH = 64;
      const total = previewH + navH + 16;
      root.style.setProperty("--live-bottom-pad", `${total}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    if (nextPreviewRef.current) ro.observe(nextPreviewRef.current);
    if (shareBtnRef.current) ro.observe(shareBtnRef.current);
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, [isAdvanced]);

  // Track visual viewport (iOS keyboard) and expose --keyboard-offset.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      document.documentElement.style.setProperty('--keyboard-offset', `${Math.max(0, offset)}px`);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Respect user's theme — no forced dark mode. ThemeContext handles light/dark.

  // Aggressive backup: write to localStorage on every meaningful state change
  // AND right before the page is hidden/unloaded (iOS suspends JS quickly).
  useEffect(() => {
    if (!selectedSessionId || sessionDone) return;
    const save = () => {
      try {
        localStorage.setItem('live_session_backup', JSON.stringify({
          sessionId: selectedSessionId,
          completedSets,
          substitutions,
          skippedExercises: Array.from(skippedExercises),
          activeExerciseKey,
          startTime,
          restEndTime: globalRestSeconds ? Date.now() + globalRestSeconds * 1000 : null,
          date: new Date().toISOString(),
        }));
      } catch { /* ignore quota errors */ }
    };
    save();
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', save);
    return () => {
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', save);
    };
  }, [completedSets, substitutions, skippedExercises, activeExerciseKey, startTime, globalRestSeconds, sessionDone, selectedSessionId]);

  // Re-sync elapsed time when the user returns to the tab (iOS suspends timers).
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !sessionDone) {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [startTime, sessionDone]);

  // Persist startTime once on mount; clean up dedicated keys on unmount.
  useEffect(() => {
    try { localStorage.setItem("ls_start_time", String(startTime)); } catch {}
    return () => {
      try {
        localStorage.removeItem("ls_start_time");
        localStorage.removeItem(LS_ACTIVE_KEY);
      } catch {}
    };
  }, [startTime, LS_ACTIVE_KEY]);

  // Snapshot critical state when the app is backgrounded (iOS eviction).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        try {
          localStorage.setItem("ls_start_time", String(startTime));
          if (activeExerciseKey) {
            localStorage.setItem(LS_ACTIVE_KEY, activeExerciseKey);
          }
        } catch {}
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [startTime, activeExerciseKey, LS_ACTIVE_KEY]);

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
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select(`
            id, name, day_of_week, notes, is_free_session, created_by,
            session_sections(id, name, sort_order, notes, duration_estimate, icon),
            session_exercises(
              id, sort_order, sets, reps_min, reps_max, rest_seconds, tempo,
              rpe_target, suggested_weight, coach_notes, video_url, video_search_query,
              section_id, is_archived, superset_group,
              exercise:exercises(id, name, name_en, muscle_group, equipment, type, tracking_type, video_url_female, video_url_male)
            )
          `)
          .eq("id", selectedSessionId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          const activeExercises = (data.session_exercises || []).filter((e: any) => !e.is_archived);
          const sections = (data.session_sections || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((sec: any) => ({
              ...sec,
              exercises: activeExercises
                .filter((e: any) => e.section_id === sec.id)
                .sort((a: any, b: any) => a.sort_order - b.sort_order),
            }));
          const unsectioned = activeExercises
            .filter((e: any) => !e.section_id)
            .sort((a: any, b: any) => a.sort_order - b.sort_order);
          if (unsectioned.length > 0) {
            sections.push({ id: "default", name: t("session:exercises_section", "Exercises"), sort_order: 999, notes: null, duration_estimate: null, icon: null, exercises: unsectioned });
          }
          setFreeSession({ ...data, sections });
        }
      } catch (err) {
        console.error("[LiveSession] fetchFree error:", err);
      } finally {
        setFreeSessionLoading(false);
      }
    };
    fetchFree();
  }, [programLoading, programSession, selectedSessionId]);

  const selectedSession = programSession || freeSession;

  const { data: previousPerformance } = useQuery({
    queryKey: ["previous-performance", studentId, selectedSession?.id],
    queryFn: async () => {
      if (!user || !selectedSession?.id || !studentId) return null;
      const { data: prevSession } = await supabase
        .from("completed_sessions")
        .select("id, completed_at")
        .eq("student_id", studentId)
        .eq("session_id", selectedSession.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!prevSession) return null;
      const { data: sets } = await supabase
        .from("completed_sets")
        .select("session_exercise_id, set_number, weight, reps")
        .eq("completed_session_id", prevSession.id)
        .order("set_number", { ascending: true });
      return sets || [];
    },
    enabled: !!user && !!selectedSession?.id,
    staleTime: 5 * 60 * 1000,
  });

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

  /**
   * Map of `${sIdx}-${eIdx}` → partner key when this exercise is part of a
   * bi-set (two consecutive exercises in the same section sharing the same
   * non-null `superset_group`).
   */
  const supersetPartnerMap = useMemo(() => {
    const map: Record<string, { partnerKey: string; isFirst: boolean; firstKey: string }> = {};
    if (!selectedSession) return map;
    selectedSession.sections.forEach((section: any, sIdx: number) => {
      const exs = section.exercises as any[];
      for (let i = 0; i < exs.length - 1; i++) {
        const a = exs[i];
        const b = exs[i + 1];
        const ag = a?.superset_group ?? a?.supersetGroup;
        const bg = b?.superset_group ?? b?.supersetGroup;
        if (ag != null && ag === bg) {
          const keyA = `${sIdx}-${i}`;
          const keyB = `${sIdx}-${i + 1}`;
          map[keyA] = { partnerKey: keyB, isFirst: true, firstKey: keyA };
          map[keyB] = { partnerKey: keyA, isFirst: false, firstKey: keyA };
        }
      }
    });
    return map;
  }, [selectedSession]);

  // Latest completedSets in a ref so the rest-gating callback can read it
  // synchronously without recreating itself on every change.
  const completedSetsRef = useRef(completedSets);

  // Wrapper qui met à jour ref et state de façon synchrone pour éviter
  // un frame stale dans les callbacks (notamment bi-set).
  const setCompletedSetsSync = useCallback(
    (updater: React.SetStateAction<Record<string, EnhancedCompletedSet[]>>) => {
      setCompletedSets(prev => {
        const next = typeof updater === "function"
          ? (updater as (p: Record<string, EnhancedCompletedSet[]>) => Record<string, EnhancedCompletedSet[]>)(prev)
          : updater;
        completedSetsRef.current = next;
        return next;
      });
    },
    [],
  );

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

  const countValidatedSets = useCallback((key: string) => {
    const arr = completedSetsRef.current[key] || [];
    const tType = trackingTypeMap[key] || "weight_reps";
    return arr.filter((s: any) =>
      tType === "duration" ? (s.durationSeconds || 0) > 0 : (s.reps || 0) > 0,
    ).length;
  }, [trackingTypeMap]);

  /**
   * Bi-set aware rest trigger. When called from an exercise that has a
   * partner, only fires the global rest timer once both partners have
   * completed the same set index. Otherwise (non-superset) behaves exactly
   * like setGlobalRestSeconds.
   */
  const handleSupersetAwareRest = useCallback(
    (key: string, restSec: number) => {
      const link = supersetPartnerMap[key];
      if (!link) {
        setGlobalRestSeconds(restSec);
        return;
      }
      const myCount = countValidatedSets(key);
      const partnerCount = countValidatedSets(link.partnerKey);
      if (myCount > partnerCount) {
        // Partner hasn't done this round yet → hand control to partner, no rest.
        setActiveExercise(link.partnerKey);
      } else {
        // Both partners have completed this round → rest, then resume on first.
        setGlobalRestSeconds(restSec);
        setActiveExercise(link.firstKey);
      }
    },
    [supersetPartnerMap, countValidatedSets, setActiveExercise],
  );

  const mappedSections = useMemo<ProgramSection[]>(() => {
    if (!selectedSession) return [];
    return selectedSession.sections.map((section: any) => ({
      name: section.name,
      duration: section.duration_estimate || "",
      notes: section.notes || "",
      exercises: section.exercises.map((ex: any) => ({
        name: ex.exercise?.name || t("session:exercise_fallback", "Exercise"),
        exerciseId: ex.exercise?.id,
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
        supersetGroup: (ex as any).superset_group ?? null,
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

  const exerciseNameMap = useMemo(() => {
    const map = new Map<string, string>();
    sessionProgram.sections.forEach((section, sIdx) => {
      section.exercises.forEach((ex, eIdx) => {
        const key = `${sIdx}-${eIdx}`;
        const sub = substitutions.find(s => s.key === key);
        map.set(key, sub ? sub.newName : ex.name || t("session:exercise_fallback", "Exercise"));
      });
    });
    return map;
  }, [sessionProgram.sections, substitutions]);

  const getExerciseName = (sIdx: number, eIdx: number): string =>
    exerciseNameMap.get(`${sIdx}-${eIdx}`) || t("session:exercise_fallback", "Exercise");

  const allExercises: ProgramExerciseDetail[] = sessionProgram.sections.flatMap((s) => s.exercises);

  // Timer
  useEffect(() => {
    if (sessionDone) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime, sessionDone]);

  // Snapshot active exercise when backgrounded + BFCache elapsed re-sync
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && activeExerciseKey) {
        localStorage.setItem(LS_ACTIVE_KEY, activeExerciseKey);
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      // BFCache restore — re-sync elapsed without waiting for next interval tick
      if (e.persisted) {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow as EventListener);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow as EventListener);
    };
  }, [activeExerciseKey, startTime, LS_ACTIVE_KEY]);

  // Scroll to the last active exercise once hydration is complete
  useEffect(() => {
    if (!hydrated) return;
    const savedKey = localStorage.getItem(LS_ACTIVE_KEY);
    if (!savedKey || savedKey === "0-0") return;
    // Small delay to let the DOM render
    setTimeout(() => {
      const el = document.querySelector(`[data-exercise-key="${savedKey}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }, [hydrated, LS_ACTIVE_KEY]);

  // Hydrate or create completed_session at mount.
  // - If an in-progress completed_session already exists for (student, session),
  //   reuse it and rehydrate completedSets + skippedExercises from DB.
  // - Otherwise insert a new completed_session.
  useEffect(() => {
    if (!user || !selectedSession?.id || completedSessionId || sessionDone || hydrated) return;
    // Wait until the session_exercise id map is populated so we can key sets correctly
    if (Object.keys(sessionExerciseIdMap).length === 0) return;

    const hydrateOrCreate = async () => {
      try {
        // 1. Look up an existing in-progress session (completed_at IS NULL)
        const { data: existing, error: lookupError } = await supabase
          .from("completed_sessions")
          .select("id, started_at")
          .eq("student_id", studentId!)
          .eq("session_id", selectedSession.id)
          .is("completed_at", null)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lookupError) throw lookupError;

        let csId = existing?.id;

        // Use the DB record's started_at as the real timer anchor
        if (existing?.started_at) {
          setStartTime(new Date(existing.started_at).getTime());
        }

        if (!csId) {
          // 2a. No in-progress session — create one
          const { data: created, error: insertError } = await supabase
            .from("completed_sessions")
            .insert({
              student_id: studentId!,
              session_id: selectedSession.id,
              started_at: new Date(startTime).toISOString(),
            })
            .select("id")
            .single();
          if (insertError) throw insertError;
          csId = created.id;
        } else {
          // 2b. Existing session — fetch already-logged sets + skipped exercises
          const [setsRes, skippedRes] = await Promise.all([
            supabase
              .from("completed_sets")
              .select("session_exercise_id, set_number, weight, reps, rpe_actual, is_failure, duration_seconds")
              .eq("completed_session_id", csId),
            supabase
              .from("skipped_exercises")
              .select("session_exercise_id")
              .eq("completed_session_id", csId),
          ]);

          // Build reverse map: session_exercise_id -> "sIdx-eIdx" key
          const reverseMap: Record<string, string> = {};
          for (const [key, seId] of Object.entries(sessionExerciseIdMap)) {
            if (seId) reverseMap[seId] = key;
          }

          // Rehydrate completedSets
          if (setsRes.data && setsRes.data.length > 0) {
            const grouped: Record<string, EnhancedCompletedSet[]> = {};
            for (const row of setsRes.data) {
              const key = reverseMap[row.session_exercise_id];
              if (!key) continue;
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push({
                setNumber: row.set_number,
                weight: Number(row.weight) || 0,
                reps: row.reps || 0,
                isFailure: !!row.is_failure,
                rpeActual: row.rpe_actual ?? null,
                durationSeconds: row.duration_seconds || 0,
              });
            }
            // Sort each group by set_number
            for (const k of Object.keys(grouped)) {
              grouped[k].sort((a, b) => a.setNumber - b.setNumber);
            }
            setCompletedSets(grouped);
            setHasStartedWorkout(true);

            // Position activeExerciseKey on first non-finished, non-skipped exercise
            const skippedKeys = new Set(
              (skippedRes.data || [])
                .map(s => reverseMap[s.session_exercise_id])
                .filter(Boolean) as string[]
            );
            outer: for (let si = 0; si < selectedSession.sections.length; si++) {
              for (let ei = 0; ei < selectedSession.sections[si].exercises.length; ei++) {
                const k = `${si}-${ei}`;
                if (skippedKeys.has(k)) continue;
                const setsForKey = grouped[k] || [];
                const expectedSets = selectedSession.sections[si].exercises[ei].sets || 3;
                const allDone =
                  setsForKey.length >= expectedSets &&
                  setsForKey.every(s => s.reps > 0 || (s.durationSeconds || 0) > 0);
                if (!allDone) {
                  setActiveExercise(k);
                  break outer;
                }
              }
            }
          }

          // Rehydrate skippedExercises
          if (skippedRes.data && skippedRes.data.length > 0) {
            const skippedKeys = (skippedRes.data
              .map(s => reverseMap[s.session_exercise_id])
              .filter(Boolean) as string[]);
            setSkippedExercises(new Set(skippedKeys));
          }

          toast.success("Séance reprise ✓", { duration: 2000 });
        }

        setCompletedSessionId(csId!);
        setHydrated(true);
      } catch (e) {
        console.error("Error hydrating/creating completed session:", e);
        toast.error(t("session:session_create_failed"));
      }
    };
    hydrateOrCreate();
  }, [user, selectedSession?.id, startTime, completedSessionId, sessionDone, hydrated, sessionExerciseIdMap, t]);

  const completedCount = Object.entries(completedSets).filter(([key, sets]) => !skippedExercises.has(key) && sets.length > 0 && sets.every(s => s.reps > 0)).length;
  const inProgressCount = Object.entries(completedSets).filter(([key, sets]) => !skippedExercises.has(key) && sets.length > 0 && sets.some(s => s.reps > 0 || s.weight > 0) && !sets.every(s => s.reps > 0)).length;
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
    if (Object.keys(sessionExerciseIdMap).length === 0) return;
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
  }, [completedSets, completedSessionId, sessionExerciseIdMap]);

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
      setActiveExercise(nextKey);
      setTimeout(() => {
        document.querySelector(`[data-exercise-key="${nextKey}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
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
    setFinishError(false);
    if (!completedSessionId) {
      localStorage.removeItem(LS_ACTIVE_KEY);
      setSessionDone(true);
      return;
    }

    try {
      // Save all unsaved sets first
      for (const key of Object.keys(completedSets)) {
        if (!skippedExercises.has(key)) {
          const ok = await saveSetsForExercise(key);
          if (!ok) throw new Error("Failed to save sets for " + key);
        }
      }
      // Mark session as completed
      const { error } = await supabase.from("completed_sessions").update({
        completed_at: new Date().toISOString(),
        duration: elapsed,
      }).eq("id", completedSessionId);
      if (error) throw error;

      // Success — show celebration
      localStorage.removeItem(LS_ACTIVE_KEY);
      setSessionDone(true);
      try { localStorage.removeItem('live_session_backup'); } catch {}
      try {
        localStorage.removeItem("ls_start_time");
        localStorage.removeItem(LS_ACTIVE_KEY);
      } catch {}
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"] });
        setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 } }), 300);
      } catch {}
      try { navigator.vibrate?.([100, 50, 100, 50, 200]); } catch {}
      toast.success(t('session:session_done'));
    } catch (e) {
      console.error("Error finishing session:", e);
      setFinishError(true);
      toast.error(t("session:finish_failed"));
    }
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
    if (nextKey) setActiveExercise(nextKey);
    setSkipTargetKey(null);
  };

  const handleClose = () => {
    try {
      if (completedSessionId) {
        localStorage.removeItem("live_session_backup");
      } else {
        console.warn("[LiveSession] No DB session ID — saving backup to localStorage");
        const backupData = {
          sessionId: selectedSession?.id,
          date: new Date().toISOString(),
          duration: elapsed,
          completedSets,
          substitutions,
          exerciseCount: allExercises.length,
          completedCount,
        };
        localStorage.setItem("live_session_backup", JSON.stringify(backupData));
      }
    } catch (e) {
      // QuotaExceededError or private browsing — non-fatal
      console.warn("[LiveSession] localStorage backup failed:", e);
    }
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
    const originalName = sessionProgram.sections[sIdx]?.exercises[eIdx]?.name || t("session:exercise_fallback", "Exercise");
    setSubstitutions(prev => [...prev.filter(s => s.key !== swapTargetKey), { key: swapTargetKey, originalName, newName: alternative.name, newEquipment: alternative.equipment }]);
    setCompletedSets(prev => { const u = { ...prev }; delete u[swapTargetKey]; return u; });

    setSwapSelectedName(alternative.name);
    toast.success(`✓ ${alternative.name} sélectionné`);
    setTimeout(() => {
      setSwapSheetOpen(false);
      setSwapTargetKey(null);
      setSwapSelectedName(null);
    }, 500);
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

  const handleToggleBiSet = async (sIdx: number, eIdx: number) => {
    if (!selectedSession) return;
    const keyA = `${sIdx}-${eIdx}`;
    const keyB = `${sIdx}-${eIdx + 1}`;
    const seIdA = sessionExerciseIdMap[keyA];
    const seIdB = sessionExerciseIdMap[keyB];
    if (!seIdA || !seIdB) return;

    const alreadyLinked = supersetPartnerMap[keyA]?.isFirst === true;

    let newGroup: number | null;
    if (alreadyLinked) {
      newGroup = null;
    } else {
      const used = new Set<number>();
      (selectedSession.sections[sIdx]?.exercises || []).forEach((e: any) => {
        const g = e.superset_group ?? e.supersetGroup;
        if (typeof g === "number") used.add(g);
      });
      let g = 1;
      while (used.has(g)) g++;
      newGroup = g;
    }

    const applyLocal = (session: any) => ({
      ...session,
      sections: session.sections.map((sec: any, si: number) => {
        if (si !== sIdx) return sec;
        return {
          ...sec,
          exercises: sec.exercises.map((e: any, ei: number) =>
            ei === eIdx || ei === eIdx + 1 ? { ...e, superset_group: newGroup } : e,
          ),
        };
      }),
    });

    const previousFree = freeSession;
    if (freeSession) {
      setFreeSession((prev: any) => applyLocal(prev));
    }

    const { error } = await supabase
      .from("session_exercises")
      .update({ superset_group: newGroup })
      .in("id", [seIdA, seIdB]);

    if (error) {
      console.error("Error toggling bi-set:", error);
      toast.error(t("common:error"));
      if (previousFree) setFreeSession(previousFree);
      return;
    }

    if (programSession) {
      queryClient.invalidateQueries({ queryKey: ["student-program"] });
    }

    toast.success(
      newGroup === null
        ? t("session:biset_unlinked", { defaultValue: "Bi-set délié" })
        : t("session:biset_linked", { defaultValue: "Exercices liés en bi-set ⚡" }),
    );
  };

  const swapExerciseOriginalName = swapTargetKey
    ? sessionProgram.sections[parseInt(swapTargetKey.split("-")[0])]?.exercises[parseInt(swapTargetKey.split("-")[1])]?.name || ""
    : "";

  if (programLoading || freeSessionLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-center space-y-1">
          <p className="font-semibold text-sm">Reprise de séance…</p>
          <p className="text-xs text-muted-foreground">Chargement de ta progression</p>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Synchronisation…</p>
      </div>
    );
  }

  // Session not found — past session or deleted
  if (!selectedSession && selectedSessionId) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Clock className="w-8 h-8 text-muted-foreground" />
        <p className="text-foreground font-semibold">{t('session:session_not_found', 'Séance introuvable')}</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          {t('session:session_not_found_desc', 'Cette séance a peut-être été supprimée ou appartient à un programme précédent.')}
        </p>
        <Button variant="outline" onClick={() => navigate("/student")} className="mt-2">
          {t('common:back_to_app', 'Retour')}
        </Button>
      </div>
    );
  }

  // Finish failed — show retry
  if (finishError && !sessionDone) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <CloudOff className="w-10 h-10 text-destructive" />
        <p className="text-foreground font-semibold text-lg">{t("session:finish_failed")}</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          {t("session:save_failed_final")}
        </p>
        <Button
          onClick={async () => {
            setIsSaving(true);
            try {
              await finishSession();
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={isSaving}
          className="mt-2"
        >
          {isSaving ? t("session:saving") : t("session:retry")}
        </Button>
        <Button variant="ghost" onClick={() => navigate("/student")} className="text-muted-foreground">
          {t("common:back")}
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
    <div className="min-h-[100dvh] bg-background text-foreground -m-4 md:-m-8">
      {/* Immersive stats bar */}
      <WorkoutStatsBar
        elapsed={elapsed}
        completedSets={completedSets}
        totalExercises={allExercises.length}
        completedExerciseCount={completedCount}
        inProgressExerciseCount={inProgressCount}
        sessionTitle={sessionProgram.title}
        onBack={() => navigate("/student")}
        onProgression={() => setShowProgression(!showProgression)}
        showProgression={showProgression}
        showDelete={!hasStartedWorkout}
        onDelete={() => setDeleteDialogOpen(true)}
        saveStatus={saveStatus}
      />

      {/* Content — pb clears WorkoutNav + ShareButton + NextExercisePreview + safe-area.
          --live-bottom-pad is updated via ResizeObserver below. */}
      <div
        ref={scrollRef}
        className="max-w-2xl mx-auto px-3 py-4 space-y-3 overscroll-none"
        style={{
          paddingBottom: "calc(var(--live-bottom-pad, 14rem) + env(safe-area-inset-bottom))",
          WebkitOverflowScrolling: 'touch',
        }}
      >
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
          <p className="text-xs text-muted-foreground font-medium px-1">
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
              className="bg-card border border-border rounded-xl p-4"
            >
              <h3 className="font-bold text-sm mb-3 text-foreground">{t('session:progression_plan')}</h3>
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
                  const biSetLink = supersetPartnerMap[key];
                  const showBiSetHeader = !!biSetLink && biSetLink.isFirst;

                  return (
                  <div key={key} className={cn(biSetLink && "relative")}>
                    {showBiSetHeader && (
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-[0.05em]">
                          ↕ Bi-set
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Alterner les séries · repos partagé après chaque tour
                        </span>
                      </div>
                    )}
                    {biSetLink && (
                      <div
                        aria-hidden
                        className={cn(
                          "absolute left-0 w-1 bg-primary/60 rounded-full",
                          biSetLink.isFirst ? "top-8 bottom-[-12px]" : "top-[-12px] bottom-4",
                        )}
                      />
                    )}
                    <div
                      data-exercise-key={key}
                      role={!isActive && !isSkipped ? "button" : undefined}
                      tabIndex={!isActive && !isSkipped ? 0 : undefined}
                      onClick={() => !isActive && !isSkipped && setActiveExercise(key)}
                      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isActive && !isSkipped) { e.preventDefault(); setActiveExercise(key); } }}
                      className={cn(!isActive && !isSkipped && "cursor-pointer", biSetLink && "pl-3")}
                    >
                      <EnhancedExerciseCard
                        name={displayName}
                        exerciseId={ex.exerciseId}
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
                        onSetValidated={(rest) => handleSupersetAwareRest(key, rest)}
                        onRestStart={(secs) => handleSupersetAwareRest(key, secs)}
                        onSwapExercise={() => handleOpenSwap(key)}
                        onSkipExercise={() => handleOpenSkip(key)}
                        isSubstituted={isSubstituted}
                        isSkipped={isSkipped}
                        trackingType={(trackingTypeMap[key] as any) || "weight_reps"}
                        sessionExerciseId={sessionExerciseIdMap[key]}
                        completedSessionId={completedSessionId || undefined}
                        onActivate={() => setActiveExercise(key)}
                        previousSets={
                          previousPerformance && sessionExerciseIdMap[key]
                            ? previousPerformance
                                .filter((s: any) => s.session_exercise_id === sessionExerciseIdMap[key])
                                .map((s: any) => ({ weight: Number(s.weight) || 0, reps: s.reps || 0 }))
                            : undefined
                        }
                      />
                    </div>
                    {/* Bouton lier/délier bi-set avec l'exercice suivant */}
                    {eIdx < section.exercises.length - 1 && !isSkipped && (
                      <div className="flex justify-center my-1">
                        <BiSetToggle
                          linked={isLinkedToNext(section.exercises as any[], eIdx)}
                          onToggle={() => handleToggleBiSet(sIdx, eIdx)}
                        />
                      </div>
                    )}
                  </div>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90"
                disabled={completedCount === 0}
              >
                {t('session:finish_session', { completed: completedCount, total: allExercises.length })}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Terminer la séance ?</AlertDialogTitle>
                <AlertDialogDescription>
                  {completedCount < allExercises.length
                    ? `${completedCount} exercice(s) sur ${allExercises.length} complété(s). Les exercices restants ne seront pas enregistrés.`
                    : "Tous les exercices sont complétés. Bravo !"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Reprendre la séance</AlertDialogCancel>
                <AlertDialogAction onClick={() => finishSession()}>
                  Terminer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Next exercise preview (Simple mode — always visible) */}
      {!isAdvanced && nextExerciseInfo && (
        <NextExercisePreview
          ref={nextPreviewRef}
          name={nextExerciseInfo.name}
          sets={nextExerciseInfo.sets}
          reps={nextExerciseInfo.reps}
        />
      )}

      {/* Share button */}
      <div
        ref={shareBtnRef}
        className="fixed md:bottom-20 md:right-4 z-20"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 34px))', right: '1rem' }}
      >
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
        onClose={() => { setSwapSheetOpen(false); setSwapTargetKey(null); setSwapSelectedName(null); }}
        exerciseName={swapExerciseOriginalName}
        group={EXERCISE_ALTERNATIVES[swapExerciseOriginalName] || dynamicAlternatives}
        onSelect={handleSwapSelect}
        selectedName={swapSelectedName}
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
      {globalRestSeconds !== null && globalRestSeconds > 0 && (
        <div
          className="fixed left-3 right-3 z-40 rounded-2xl shadow-lg overflow-hidden"
          style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 34px) + var(--keyboard-offset, 0px))' }}
        >
          <LinearRestTimer
            key={`global-${globalRestSeconds}-${activeExerciseKey}`}
            initialSeconds={globalRestSeconds}
            storageKey={`rest_${activeExerciseKey}`}
            onComplete={() => setGlobalRestSeconds(null)}
          />
        </div>
      )}
    </div>
  );
};

export default LiveSession;
