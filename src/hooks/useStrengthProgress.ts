import { useState, useEffect } from "react";
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

export const useStrengthProgress = () => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [dataPoints, setDataPoints] = useState<ExerciseDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch exercises the student has done
  useEffect(() => {
    if (!studentId) return;
    const fetch = async () => {
      const { data: completedSessions } = await supabase
        .from("completed_sessions")
        .select("id")
        .eq("student_id", studentId);
      
      if (!completedSessions || completedSessions.length === 0) return;
      
      const csIds = completedSessions.map(cs => cs.id);
      const { data: sets } = await supabase
        .from("completed_sets")
        .select("session_exercise_id")
        .in("completed_session_id", csIds);
      
      if (!sets || sets.length === 0) return;
      
      const seIds = [...new Set(sets.map(s => s.session_exercise_id))];
      const { data: sessionExercises } = await supabase
        .from("session_exercises")
        .select("exercise_id, exercises(id, name, name_en)")
        .in("id", seIds);
      
      if (!sessionExercises) return;
      
      const uniqueExercises = new Map<string, string>();
      sessionExercises.forEach((se: any) => {
        if (se.exercises && !uniqueExercises.has(se.exercise_id)) {
          uniqueExercises.set(se.exercise_id, se.exercises.name);
        }
      });
      
      const opts = Array.from(uniqueExercises.entries()).map(([id, name]) => ({
        exerciseId: id,
        exerciseName: name,
      }));
      setExercises(opts);
      if (opts.length > 0) setSelectedExercise(opts[0].exerciseId);
    };
    fetch();
  }, [studentId]);

  // Fetch data points for selected exercise
  useEffect(() => {
    if (!studentId || !selectedExercise) return;
    setLoading(true);
    
    const fetchData = async () => {
      // Get all session_exercises for this exercise
      const { data: sessionExercises } = await supabase
        .from("session_exercises")
        .select("id, session_id")
        .eq("exercise_id", selectedExercise);

      if (!sessionExercises || sessionExercises.length === 0) {
        setDataPoints([]);
        setLoading(false);
        return;
      }

      // Get completed sessions by this student
      const { data: completedSessions } = await supabase
        .from("completed_sessions")
        .select("id, started_at, session_id")
        .eq("student_id", user.id)
        .order("started_at", { ascending: true });

      if (!completedSessions || completedSessions.length === 0) {
        setDataPoints([]);
        setLoading(false);
        return;
      }

      // Match completed sessions to session exercises
      const seIds = sessionExercises.map(se => se.id);
      const csIds = completedSessions.map(cs => cs.id);

      const { data: allSets } = await supabase
        .from("completed_sets")
        .select("completed_session_id, weight, reps, set_number")
        .in("session_exercise_id", seIds)
        .in("completed_session_id", csIds);

      if (!allSets) {
        setDataPoints([]);
        setLoading(false);
        return;
      }

      // Group sets by completed_session_id
      const csMap = new Map(completedSessions.map(cs => [cs.id, cs]));
      const grouped = new Map<string, typeof allSets>();
      allSets.forEach(set => {
        const existing = grouped.get(set.completed_session_id) || [];
        existing.push(set);
        grouped.set(set.completed_session_id, existing);
      });

      const points: ExerciseDataPoint[] = [];
      grouped.forEach((sets, csId) => {
        const cs = csMap.get(csId);
        if (!cs) return;
        const maxWeight = Math.max(...sets.map(s => s.weight || 0));
        const totalVolume = sets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0);
        points.push({
          date: cs.started_at.split("T")[0],
          maxWeight,
          totalVolume: Math.round(totalVolume),
        });
      });

      points.sort((a, b) => a.date.localeCompare(b.date));
      setDataPoints(points.slice(-8));
      setLoading(false);
    };

    fetchData();
  }, [user, selectedExercise]);

  return { exercises, selectedExercise, setSelectedExercise, dataPoints, loading };
};
