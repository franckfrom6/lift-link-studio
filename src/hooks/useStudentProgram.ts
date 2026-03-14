import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";

export interface DBExercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  type: string;
  video_url?: string | null;
  video_url_female?: string | null;
  video_url_male?: string | null;
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
  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
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
  created_at: string;
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

async function fetchProgramTree(studentId: string): Promise<DBProgram | null> {
  const { data: programs, error: pErr } = await supabase
    .from("programs")
    .select("*")
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(1);

  if (pErr) throw pErr;
  if (!programs || programs.length === 0) return null;

  const prog = programs[0];

  // Parallel: weeks + progression
  const [weeksRes, progressionRes] = await Promise.all([
    supabase.from("program_weeks").select("*").eq("program_id", prog.id).order("week_number"),
    supabase.from("program_progression").select("*").eq("program_id", prog.id).order("sort_order"),
  ]);

  const weeks = weeksRes.data;
  const progression = progressionRes.data || [];

  if (!weeks || weeks.length === 0) {
    return { ...prog, weeks: [], progression };
  }

  const weekIds = weeks.map(w => w.id);

  // Fetch sessions scoped to week IDs
  const sessionsRes = await supabase
    .from("sessions").select("*").in("week_id", weekIds).eq("is_deleted", false).order("day_of_week");

  const sessions = sessionsRes.data || [];
  const sessionIds = sessions.map(s => s.id);

  // Fetch sections + exercises scoped to actual session IDs
  let sections: any[] = [];
  let sessionExercises: any[] = [];
  if (sessionIds.length > 0) {
    const [secRes, seRes] = await Promise.all([
      supabase.from("session_sections").select("*").in("session_id", sessionIds).order("sort_order"),
      supabase.from("session_exercises").select("*, exercise:exercises(*)").in("session_id", sessionIds).order("sort_order"),
    ]);
    sections = secRes.data || [];
    sessionExercises = seRes.data || [];
  }

  // Assemble tree
  const sectionMap = new Map<string, DBSection>();
  for (const sec of sections) {
    sectionMap.set(sec.id, { ...sec, exercises: [] });
  }

  for (const se of sessionExercises) {
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
    const sessSections = sections
      .filter(sec => sec.session_id === s.id)
      .map(sec => sectionMap.get(sec.id)!)
      .filter(Boolean);
    sessionMap.set(s.id, { ...s, sections: sessSections });
  }

  const assembledWeeks: DBWeek[] = weeks.map(w => ({
    ...w,
    sessions: sessions.filter(s => s.week_id === w.id).map(s => sessionMap.get(s.id)!).filter(Boolean),
  }));

  return {
    id: prog.id,
    name: prog.name,
    status: prog.status,
    created_at: prog.created_at,
    weeks: assembledWeeks,
    progression,
  };
}

export const useStudentProgram = () => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;
  const queryClient = useQueryClient();

  const queryKey = ['student-program', studentId];

  const { data: program = null, isLoading: loading, isFetching: refreshing, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchProgramTree(studentId!),
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });

  const programId = program?.id;

  // Filtered realtime subscriptions — invalidate query on changes
  useEffect(() => {
    if (!studentId || !programId) return;

    const channel = supabase
      .channel(`student-program-sync-${studentId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'programs', filter: `student_id=eq.${studentId}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'program_weeks', filter: `program_id=eq.${programId}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'program_progression', filter: `program_id=eq.${programId}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session_sections' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session_exercises' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId, programId, queryClient]);

  const seedDemo = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase.functions.invoke("seed-demo-program");
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey });
    } catch (e: any) {
      console.error("Seed error:", e);
    }
  }, [user, queryClient]);

  return {
    program,
    loading,
    refreshing,
    error: queryError?.message || null,
    refetch: () => refetch(),
    seedDemo,
  };
};
