import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { startOfWeek, endOfWeek, format } from "date-fns";

interface WeeklySummary {
  programmedDone: number;
  programmedTotal: number;
  externalCount: number;
  totalVolume: number;
  nutritionDaysLogged: number;
  totalDays: number;
  checkin: { energy: number; sleep: number; stress: number; soreness: number } | null;
}

async function fetchDashboardData(studentId: string): Promise<WeeklySummary> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const wsStr = format(weekStart, "yyyy-MM-dd");
  const weStr = format(weekEnd, "yyyy-MM-dd");

  // Parallel batch 1: independent queries
  const [completedRes, programsRes, externalRes, nutritionRes, checkinRes] = await Promise.all([
    supabase
      .from("completed_sessions")
      .select("id, session_id, started_at")
      .eq("student_id", studentId)
      .gte("started_at", weekStart.toISOString())
      .lte("started_at", weekEnd.toISOString()),
    supabase
      .from("programs")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "active")
      .limit(1),
    supabase
      .from("external_sessions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .gte("date", wsStr)
      .lte("date", weStr),
    supabase
      .from("daily_nutrition_logs")
      .select("date")
      .eq("student_id", studentId)
      .gte("date", wsStr)
      .lte("date", weStr),
    supabase
      .from("weekly_checkins")
      .select("energy_level, sleep_quality, stress_level, muscle_soreness")
      .eq("student_id", studentId)
      .gte("week_start", wsStr)
      .lte("week_start", weStr)
      .limit(1),
  ]);

  const completedSessions = completedRes.data;
  const programs = programsRes.data;

  // Programmed total: needs sequential fetch (depends on program)
  let programmedTotal = 0;
  if (programs && programs.length > 0) {
    const { data: weeks } = await supabase
      .from("program_weeks")
      .select("id")
      .eq("program_id", programs[0].id)
      .limit(1);
    if (weeks && weeks.length > 0) {
      const { count } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("week_id", weeks[0].id);
      programmedTotal = count || 0;
    }
  }

  // Volume: depends on completedSessions
  let totalVolume = 0;
  if (completedSessions && completedSessions.length > 0) {
    const csIds = completedSessions.map(cs => cs.id);
    const { data: sets } = await supabase
      .from("completed_sets")
      .select("weight, reps")
      .in("completed_session_id", csIds);
    if (sets) {
      totalVolume = sets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0);
    }
  }

  const uniqueDays = new Set(nutritionRes.data?.map(l => l.date));
  const totalDays = Math.min(7, Math.floor((now.getTime() - weekStart.getTime()) / 86400000) + 1);
  const checkins = checkinRes.data;

  return {
    programmedDone: completedSessions?.length || 0,
    programmedTotal,
    externalCount: externalRes.count || 0,
    totalVolume: Math.round(totalVolume),
    nutritionDaysLogged: uniqueDays.size,
    totalDays,
    checkin: checkins && checkins.length > 0
      ? { energy: checkins[0].energy_level, sleep: checkins[0].sleep_quality, stress: checkins[0].stress_level, soreness: checkins[0].muscle_soreness }
      : null,
  };
}

export const useStudentDashboard = () => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;

  const { data: summary = null, isLoading: loading } = useQuery({
    queryKey: ['student-dashboard', studentId],
    queryFn: () => fetchDashboardData(studentId!),
    enabled: !!studentId,
    staleTime: 30 * 1000,
  });

  return { summary, loading };
};
