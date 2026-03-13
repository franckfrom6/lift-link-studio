import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";

interface ExerciseDataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  isDeload?: boolean;
  substituteName?: string;
}

interface ExerciseOption {
  exerciseId: string;
  exerciseName: string;
}

async function fetchExerciseOptions(studentId: string): Promise<ExerciseOption[]> {
  const { data: completedSessions } = await supabase
    .from("completed_sessions")
    .select("id")
    .eq("student_id", studentId);

  if (!completedSessions || completedSessions.length === 0) return [];

  const csIds = completedSessions.map((cs) => cs.id);
  const { data: sets } = await supabase
    .from("completed_sets")
    .select("session_exercise_id")
    .in("completed_session_id", csIds);

  if (!sets || sets.length === 0) return [];

  const seIds = [...new Set(sets.map((s) => s.session_exercise_id))];
  const { data: sessionExercises } = await supabase
    .from("session_exercises")
    .select("exercise_id, exercises(id, name, name_en)")
    .in("id", seIds);

  if (!sessionExercises) return [];

  const uniqueExercises = new Map<string, string>();
  sessionExercises.forEach((se: any) => {
    if (se.exercises && !uniqueExercises.has(se.exercise_id)) {
      uniqueExercises.set(se.exercise_id, se.exercises.name);
    }
  });

  return Array.from(uniqueExercises.entries()).map(([id, name]) => ({
    exerciseId: id,
    exerciseName: name,
  }));
}

async function fetchDataPoints(studentId: string, exerciseId: string): Promise<ExerciseDataPoint[]> {
  const [sessionExercisesRes, completedSessionsRes] = await Promise.all([
    supabase.from("session_exercises").select("id, session_id").eq("exercise_id", exerciseId),
    supabase.from("completed_sessions").select("id, started_at, session_id").eq("student_id", studentId).order("started_at", { ascending: true }),
  ]);

  const sessionExercises = sessionExercisesRes.data || [];
  const completedSessions = completedSessionsRes.data || [];

  if (sessionExercises.length === 0 || completedSessions.length === 0) return [];

  const seIds = sessionExercises.map((se) => se.id);
  const csIds = completedSessions.map((cs) => cs.id);

  const { data: allSets } = await supabase
    .from("completed_sets")
    .select("completed_session_id, weight, reps, set_number")
    .in("session_exercise_id", seIds)
    .in("completed_session_id", csIds);

  if (!allSets) return [];

  const csMap = new Map(completedSessions.map((cs) => [cs.id, cs]));
  const grouped = new Map<string, typeof allSets>();
  allSets.forEach((set) => {
    const existing = grouped.get(set.completed_session_id) || [];
    existing.push(set);
    grouped.set(set.completed_session_id, existing);
  });

  const points: ExerciseDataPoint[] = [];
  grouped.forEach((sets, csId) => {
    const cs = csMap.get(csId);
    if (!cs) return;
    const maxWeight = Math.max(...sets.map((s) => s.weight || 0));
    const totalVolume = sets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0);
    points.push({
      date: cs.started_at.split("T")[0],
      maxWeight,
      totalVolume: Math.round(totalVolume),
    });
  });

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points.slice(-8);
}

export const useStrengthProgress = () => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { data: exercises = [] } = useQuery({
    queryKey: ["strength-exercises", studentId],
    queryFn: () => fetchExerciseOptions(studentId!),
    enabled: !!studentId,
    staleTime: 60 * 1000,
    select: (data) => {
      // Auto-select first exercise if none selected
      if (data.length > 0 && !selectedExercise) {
        setSelectedExercise(data[0].exerciseId);
      }
      return data;
    },
  });

  const { data: dataPoints = [], isLoading: loading } = useQuery({
    queryKey: ["strength-data", studentId, selectedExercise],
    queryFn: () => fetchDataPoints(studentId!, selectedExercise!),
    enabled: !!studentId && !!selectedExercise,
    staleTime: 60 * 1000,
  });

  return { exercises, selectedExercise, setSelectedExercise, dataPoints, loading };
};
