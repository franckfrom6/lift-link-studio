import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Epley e1RM, capped at 12 reps to limit drift
export function epley(weight: number, reps: number): number {
  const r = Math.min(Math.max(reps, 1), 12);
  return weight * (1 + r / 30);
}

export interface SetRow {
  weight: number;
  reps: number;
  rpe: number | null;
  is_failure: boolean;
  set_number: number;
}

export interface SessionTopSet {
  completedSessionId: string;
  date: string;        // ISO date
  topSet: { weight: number; reps: number; e1rm: number };
  sets: SetRow[];
}

export interface ExerciseDetailData {
  exercise: {
    id: string;
    name: string;
    name_en: string | null;
    muscle_group: string;
    secondary_muscle: string | null;
    equipment: string;
    type: string;
    description: string | null;
    video_url_male: string | null;
    video_url_female: string | null;
    tracking_type: string | null;
  };
  sessions: SessionTopSet[];   // sorted asc by date, capped to last 12 within 90d
  pr: { weight: number; reps: number; date: string } | null;
  e1rmCurrent: number | null;
  e1rmDelta90d: number | null;
  isFavorite: boolean;
  coachId: string | null;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Fetch full exercise detail for a given student.
 * - studentId: target athlete (the connected user OR the impersonated one for coach view)
 * - viewerIsAthlete: true when the connected user IS the athlete (for favorite read)
 */
export function useExerciseDetail(exerciseId: string | undefined, studentId: string | undefined, viewerIsAthlete: boolean) {
  return useQuery({
    queryKey: ["exercise-detail", exerciseId, studentId],
    enabled: !!exerciseId && !!studentId,
    queryFn: async (): Promise<ExerciseDetailData> => {
      // 1. Exercise meta
      const { data: exercise, error: exErr } = await supabase
        .from("exercises")
        .select("id, name, name_en, muscle_group, secondary_muscle, equipment, type, description, video_url_male, video_url_female, tracking_type")
        .eq("id", exerciseId!)
        .maybeSingle();
      if (exErr) throw exErr;
      if (!exercise) throw new Error("Exercice introuvable");

      // 2. Find all session_exercises matching this exercise
      const { data: sxsFiltered, error: sxsFilteredErr } = await supabase
        .from("session_exercises")
        .select("id")
        .eq("exercise_id", exerciseId!);
      if (sxsFilteredErr) throw sxsFilteredErr;
      const sxIds = (sxsFiltered ?? []).map((r) => r.id);

      // 3. Completed sets for this athlete on those session_exercises
      let allSets: any[] = [];
      if (sxIds.length > 0) {
        const { data: setsData, error: setsErr } = await supabase
          .from("completed_sets")
          .select("id, weight, reps, rpe_actual, is_failure, set_number, session_exercise_id, completed_session_id, completed_sessions!inner(id, student_id, completed_at, started_at)")
          .in("session_exercise_id", sxIds)
          .eq("completed_sessions.student_id", studentId!);
        if (setsErr) throw setsErr;
        allSets = setsData ?? [];
      }

      // 4. Group by completed_session and compute top set
      const cutoff = Date.now() - NINETY_DAYS_MS;
      const bySession = new Map<string, { date: string; sets: SetRow[] }>();
      for (const s of allSets) {
        const cs = (s as any).completed_sessions;
        const finishedAt: string | null = cs?.completed_at ?? cs?.started_at ?? null;
        if (!finishedAt) continue;
        if (new Date(finishedAt).getTime() < cutoff) continue;
        const w = Number(s.weight ?? 0);
        const reps = Number(s.reps ?? 0);
        if (reps < 1) continue;
        const csId = cs.id as string;
        if (!bySession.has(csId)) bySession.set(csId, { date: finishedAt, sets: [] });
        bySession.get(csId)!.sets.push({
          weight: w,
          reps,
          rpe: s.rpe_actual ?? null,
          is_failure: !!s.is_failure,
          set_number: s.set_number ?? 0,
        });
      }

      const allSessionTopSets: SessionTopSet[] = Array.from(bySession.entries())
        .map(([id, v]) => {
          let topSet = v.sets[0];
          let topE1rm = epley(topSet.weight, topSet.reps);
          for (const set of v.sets) {
            const e = epley(set.weight, set.reps);
            if (e > topE1rm) {
              topE1rm = e;
              topSet = set;
            }
          }
          return {
            completedSessionId: id,
            date: v.date,
            sets: v.sets.sort((a, b) => a.set_number - b.set_number),
            topSet: { weight: topSet.weight, reps: topSet.reps, e1rm: topE1rm },
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const sessions = allSessionTopSets.length > 12 ? allSessionTopSets.slice(-12) : allSessionTopSets;

      // 5. PR — best (weight, reps) by absolute weight; if tie, more reps wins
      let pr: ExerciseDetailData["pr"] = null;
      for (const sess of allSessionTopSets) {
        for (const set of sess.sets) {
          if (!pr || set.weight > pr.weight || (set.weight === pr.weight && set.reps > pr.reps)) {
            pr = { weight: set.weight, reps: set.reps, date: sess.date };
          }
        }
      }

      // 6. e1RM current + 90d delta
      let e1rmCurrent: number | null = null;
      let e1rmDelta90d: number | null = null;
      if (sessions.length > 0) {
        e1rmCurrent = sessions[sessions.length - 1].topSet.e1rm;
        const first = sessions[0].topSet.e1rm;
        e1rmDelta90d = e1rmCurrent - first;
      }

      // 7. Favorite (athlete only)
      let isFavorite = false;
      if (viewerIsAthlete) {
        const { data: fav } = await supabase
          .from("exercise_favorites")
          .select("id")
          .eq("student_id", studentId!)
          .eq("exercise_id", exerciseId!)
          .maybeSingle();
        isFavorite = !!fav;
      }

      // 8. Coach id (for video request)
      const { data: rel } = await supabase
        .from("coach_students")
        .select("coach_id")
        .eq("student_id", studentId!)
        .eq("status", "active")
        .maybeSingle();

      return {
        exercise: exercise as any,
        sessions,
        pr,
        e1rmCurrent,
        e1rmDelta90d,
        isFavorite,
        coachId: rel?.coach_id ?? null,
      };
    },
  });
}

export function useToggleFavorite(exerciseId: string, studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (next: boolean) => {
      if (next) {
        const { error } = await supabase
          .from("exercise_favorites")
          .insert({ student_id: studentId, exercise_id: exerciseId });
        if (error && !String(error.message).includes("duplicate")) throw error;
      } else {
        const { error } = await supabase
          .from("exercise_favorites")
          .delete()
          .eq("student_id", studentId)
          .eq("exercise_id", exerciseId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercise-detail", exerciseId, studentId] });
    },
  });
}

export function useRequestVideo(exerciseId: string, studentId: string, coachId: string | null) {
  return useMutation({
    mutationFn: async (message?: string) => {
      if (!coachId) throw new Error("Aucun coach actif");
      const { error } = await supabase
        .from("exercise_video_requests")
        .insert({
          student_id: studentId,
          coach_id: coachId,
          exercise_id: exerciseId,
          message: message ?? null,
        });
      if (error) throw error;
    },
  });
}