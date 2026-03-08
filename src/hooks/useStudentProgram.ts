import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";

export interface DBExercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  type: string;
}

export interface DBSessionExercise {
  id: string;
  exercise_id: string;
  sort_order: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  tempo: string | null;
  rpe_target: string | null;
  suggested_weight: number | null;
  coach_notes: string | null;
  video_url: string | null;
  video_search_query: string | null;
  section_id: string | null;
  exercise: DBExercise;
}

export interface DBSection {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  duration_estimate: string | null;
  notes: string | null;
  exercises: DBSessionExercise[];
}

export interface DBSession {
  id: string;
  name: string;
  day_of_week: number;
  notes: string | null;
  sections: DBSection[];
}

export interface DBWeek {
  id: string;
  week_number: number;
  sessions: DBSession[];
}

export interface DBProgram {
  id: string;
  name: string;
  status: string;
  weeks: DBWeek[];
  progression: Array<{
    id: string;
    week_label: string;
    description: string;
    week_start: number;
    week_end: number;
    is_deload: boolean;
    sort_order: number;
  }>;
}

export const useStudentProgram = () => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const [program, setProgram] = useState<DBProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentId = user ? effectiveStudentId(user.id) : null;

  // Debounced refetch: queues a refetch if one is in-flight, never drops requests
  const pendingRef = useRef(false);
  const inFlightRef = useRef(false);

  const doFetch = useCallback(async (isRefresh: boolean) => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data: programs, error: pErr } = await supabase
        .from("programs")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "active")
        .limit(1);

      if (pErr) throw pErr;
      if (!programs || programs.length === 0) {
        setProgram(null);
        return;
      }

      const prog = programs[0];

      const { data: weeks } = await supabase
        .from("program_weeks")
        .select("*")
        .eq("program_id", prog.id)
        .order("week_number");

      const { data: progression } = await supabase
        .from("program_progression")
        .select("*")
        .eq("program_id", prog.id)
        .order("sort_order");

      if (!weeks || weeks.length === 0) {
        setProgram({ ...prog, weeks: [], progression: progression || [] });
        return;
      }

      const weekIds = weeks.map(w => w.id);
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*")
        .in("week_id", weekIds)
        .order("day_of_week");

      if (!sessions) {
        setProgram({ ...prog, weeks: weeks.map(w => ({ ...w, sessions: [] })), progression: progression || [] });
        return;
      }

      const sessionIds = sessions.map(s => s.id);
      const { data: sections } = await supabase
        .from("session_sections")
        .select("*")
        .in("session_id", sessionIds)
        .order("sort_order");

      const { data: sessionExercises } = await supabase
        .from("session_exercises")
        .select("*, exercise:exercises(*)")
        .in("session_id", sessionIds)
        .order("sort_order");

      // Assemble the tree
      const sectionMap = new Map<string, DBSection>();
      for (const sec of (sections || [])) {
        sectionMap.set(sec.id, { ...sec, exercises: [] });
      }

      for (const se of (sessionExercises || [])) {
        const ex = se.exercise as any as DBExercise;
        const mapped: DBSessionExercise = {
          id: se.id,
          exercise_id: se.exercise_id,
          sort_order: se.sort_order,
          sets: se.sets,
          reps_min: se.reps_min,
          reps_max: se.reps_max,
          rest_seconds: se.rest_seconds,
          tempo: se.tempo,
          rpe_target: se.rpe_target,
          suggested_weight: se.suggested_weight,
          coach_notes: se.coach_notes,
          video_url: se.video_url,
          video_search_query: se.video_search_query,
          section_id: se.section_id,
          exercise: ex,
        };
        if (se.section_id && sectionMap.has(se.section_id)) {
          sectionMap.get(se.section_id)!.exercises.push(mapped);
        }
      }

      const sessionMap = new Map<string, DBSession>();
      for (const s of sessions) {
        const sessSections = (sections || [])
          .filter(sec => sec.session_id === s.id)
          .map(sec => sectionMap.get(sec.id)!)
          .filter(Boolean);
        sessionMap.set(s.id, { ...s, sections: sessSections });
      }

      const assembledWeeks: DBWeek[] = weeks.map(w => ({
        ...w,
        sessions: sessions.filter(s => s.week_id === w.id).map(s => sessionMap.get(s.id)!).filter(Boolean),
      }));

      setProgram({
        id: prog.id,
        name: prog.name,
        status: prog.status,
        weeks: assembledWeeks,
        progression: progression || [],
      });
    } catch (e: any) {
      console.error("Error fetching program:", e);
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  // Smart fetch: if already in-flight, queue a re-run instead of dropping
  const fetchProgram = useCallback(async (isRefresh = false) => {
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    inFlightRef.current = true;
    await doFetch(isRefresh);
    inFlightRef.current = false;

    // If a request was queued while we were fetching, run it now
    if (pendingRef.current) {
      pendingRef.current = false;
      inFlightRef.current = true;
      await doFetch(true);
      inFlightRef.current = false;
    }
  }, [doFetch]);

  // Initial load
  useEffect(() => {
    fetchProgram(false);
  }, [fetchProgram]);

  // Realtime: refetch when program structure or exercises change
  useEffect(() => {
    if (!studentId) return;

    const channel = supabase
      .channel(`student-program-sync-${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'programs', filter: `student_id=eq.${studentId}` },
        () => fetchProgram(true)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'program_weeks' }, () => fetchProgram(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'program_progression' }, () => fetchProgram(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_exercises' }, () => fetchProgram(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchProgram(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_sections' }, () => fetchProgram(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, fetchProgram]);

  // Polling fallback: guarantees eventual sync if realtime misses events
  useEffect(() => {
    if (!studentId) return;

    const intervalId = window.setInterval(() => {
      fetchProgram(true);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [studentId, fetchProgram]);

  // Visibility-based refetch: sync when user returns to tab
  useEffect(() => {
    if (!studentId) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchProgram(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [studentId, fetchProgram]);

  const seedDemo = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-program");
      if (error) throw error;
      await fetchProgram();
    } catch (e: any) {
      console.error("Seed error:", e);
      setError(e.message);
    }
  };

  return { program, loading, refreshing, error, refetch: fetchProgram, seedDemo };
};
