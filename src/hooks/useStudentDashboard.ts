import { useState, useEffect } from "react";
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

export const useStudentDashboard = () => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const studentId = user ? effectiveStudentId(user.id) : null;

  useEffect(() => {
    if (!studentId) return;
    const fetchSummary = async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const wsStr = format(weekStart, "yyyy-MM-dd");
      const weStr = format(weekEnd, "yyyy-MM-dd");

      // Completed sessions this week
      const { data: completedSessions } = await supabase
        .from("completed_sessions")
        .select("id, session_id, started_at")
        .eq("student_id", studentId)
        .gte("started_at", weekStart.toISOString())
        .lte("started_at", weekEnd.toISOString());

      // Get total programmed sessions for the week (from active program)
      const { data: programs } = await supabase
        .from("programs")
        .select("id")
        .eq("student_id", studentId)
        .eq("status", "active")
        .limit(1);

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

      // Volume: sum weight * reps for completed sets this week
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

      // External sessions this week
      const { count: externalCount } = await supabase
        .from("external_sessions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .gte("date", wsStr)
        .lte("date", weStr);

      // Nutrition logs this week
      const { data: nutritionLogs } = await supabase
        .from("daily_nutrition_logs")
        .select("date")
        .eq("student_id", studentId)
        .gte("date", wsStr)
        .lte("date", weStr);
      const uniqueDays = new Set(nutritionLogs?.map(l => l.date));
      const totalDays = Math.min(7, Math.floor((now.getTime() - weekStart.getTime()) / 86400000) + 1);

      // Check-in this week
      const { data: checkins } = await supabase
        .from("weekly_checkins")
        .select("energy_level, sleep_quality, stress_level, muscle_soreness")
        .eq("student_id", studentId)
        .gte("week_start", wsStr)
        .lte("week_start", weStr)
        .limit(1);

      setSummary({
        programmedDone: completedSessions?.length || 0,
        programmedTotal,
        externalCount: externalCount || 0,
        totalVolume: Math.round(totalVolume),
        nutritionDaysLogged: uniqueDays.size,
        totalDays,
        checkin: checkins && checkins.length > 0
          ? { energy: checkins[0].energy_level, sleep: checkins[0].sleep_quality, stress: checkins[0].stress_level, soreness: checkins[0].muscle_soreness }
          : null,
      });
      setLoading(false);
    };

    fetchSummary();
  }, [studentId]);

  return { summary, loading };
};
