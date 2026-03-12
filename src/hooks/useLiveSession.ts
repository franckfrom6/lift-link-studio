import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedCompletedSet } from "@/components/student/EnhancedExerciseCard";

interface UseSessionTimerOptions {
  sessionDone: boolean;
}

export function useSessionTimer({ sessionDone }: UseSessionTimerOptions) {
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (sessionDone) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, sessionDone]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return { startTime, elapsed, mins, secs };
}

interface UseExerciseCompletionOptions {
  completedSessionId: string | null;
  completedSets: Record<string, EnhancedCompletedSet[]>;
  sessionExerciseIdMap: Record<string, string>;
  skippedExercises: Set<string>;
  sectionsCount: number;
  getSectionExerciseCount: (sIdx: number) => number;
  onFinish: () => void;
}

export function useExerciseCompletion({
  completedSessionId,
  completedSets,
  sessionExerciseIdMap,
  skippedExercises,
  sectionsCount,
  getSectionExerciseCount,
  onFinish,
}: UseExerciseCompletionOptions) {
  const [activeExerciseKey, setActiveExerciseKey] = useState<string>("0-0");
  const savedExercisesRef = useRef<Set<string>>(new Set());

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

  const findNextKey = (sIdx: number, eIdx: number): string | null => {
    for (let si = sIdx; si < sectionsCount; si++) {
      const startEi = si === sIdx ? eIdx + 1 : 0;
      for (let ei = startEi; ei < getSectionExerciseCount(si); ei++) {
        const candidate = `${si}-${ei}`;
        if (!skippedExercises.has(candidate)) return candidate;
      }
    }
    return null;
  };

  const handleExerciseComplete = async (key: string) => {
    await saveSetsForExercise(key);
    const [sIdx, eIdx] = key.split("-").map(Number);
    const nextKey = findNextKey(sIdx, eIdx);
    if (nextKey) {
      setActiveExerciseKey(nextKey);
    } else {
      onFinish();
    }
  };

  const saveAllUnsaved = async () => {
    for (const key of Object.keys(completedSets)) {
      if (!skippedExercises.has(key)) {
        await saveSetsForExercise(key);
      }
    }
  };

  const clearSaved = (key: string) => {
    savedExercisesRef.current.delete(key);
  };

  return {
    activeExerciseKey,
    setActiveExerciseKey,
    handleExerciseComplete,
    saveAllUnsaved,
    saveSetsForExercise,
    clearSaved,
    findNextKey,
  };
}
