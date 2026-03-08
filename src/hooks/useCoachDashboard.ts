import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, format, differenceInDays } from "date-fns";

export interface StudentOverview {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  goal: string | null;
  level: string | null;
  programName: string | null;
  programWeekCurrent: number | null;
  programWeekTotal: number | null;
  sessionsDone: number;
  sessionsTotal: number;
  lastSessionDate: string | null;
  checkin: { energy: number; sleep: number; stress: number; soreness: number } | null;
  alerts: string[];
  swapsThisWeek: number;
  substitutionsThisWeek: number;
}

export interface CoachKPIs {
  activeStudents: number;
  sessionsThisWeek: number;
  avgAdherence: number;
  alertCount: number;
}

export interface ActivityItem {
  id: string;
  type: "session_completed" | "checkin" | "swap" | "external";
  studentName: string;
  avatar: string;
  detail: string;
  timestamp: string;
}

export const useCoachDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [kpis, setKpis] = useState<CoachKPIs>({ activeStudents: 0, sessionsThisWeek: 0, avgAdherence: 0, alertCount: 0 });
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    const originalSetStudents = setStudents;
    const originalSetKpis = setKpis;
    const originalSetFeed = setFeed;
    const originalSetLoading = setLoading;

    // Temporarily wrap setters with mount check
    const run = async () => {
      await fetchAll();
    };
    run().catch(console.error);

    return () => { isMounted = false; };
  }, [user, authLoading]);

  const fetchAll = async () => {
    if (!user) return;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const wsStr = format(weekStart, "yyyy-MM-dd");
    const weStr = format(weekEnd, "yyyy-MM-dd");

    // 1. Get coach's students
    const { data: relations } = await supabase
      .from("coach_students")
      .select("student_id, status")
      .eq("coach_id", user.id)
      .eq("status", "active");

    if (!relations || relations.length === 0) {
      setLoading(false);
      return;
    }

    const studentIds = relations.map((r) => r.student_id);

    // 2. Get profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, goal, level")
      .in("user_id", studentIds);

    // 3. Get active programs
    const { data: programs } = await supabase
      .from("programs")
      .select("id, student_id, name, status")
      .in("student_id", studentIds)
      .eq("status", "active");

    // 4. Get program weeks for active programs
    let programWeekMap = new Map<string, { total: number; programId: string }>();
    if (programs && programs.length > 0) {
      const programIds = programs.map((p) => p.id);
      const { data: weeks } = await supabase
        .from("program_weeks")
        .select("program_id, week_number")
        .in("program_id", programIds);
      if (weeks) {
        const grouped = new Map<string, number[]>();
        weeks.forEach((w) => {
          const existing = grouped.get(w.program_id) || [];
          existing.push(w.week_number);
          grouped.set(w.program_id, existing);
        });
        grouped.forEach((weekNums, progId) => {
          programWeekMap.set(progId, { total: weekNums.length, programId: progId });
        });
      }
    }

    // 5. Completed sessions this week for all students
    const { data: completedSessions } = await supabase
      .from("completed_sessions")
      .select("id, student_id, started_at, session_id")
      .in("student_id", studentIds)
      .gte("started_at", weekStart.toISOString())
      .lte("started_at", weekEnd.toISOString());

    // 6. Get last completed session per student (all time)
    const { data: allCompleted } = await supabase
      .from("completed_sessions")
      .select("student_id, started_at")
      .in("student_id", studentIds)
      .order("started_at", { ascending: false });

    const lastSessionMap = new Map<string, string>();
    allCompleted?.forEach((cs) => {
      if (!lastSessionMap.has(cs.student_id)) {
        lastSessionMap.set(cs.student_id, cs.started_at);
      }
    });

    // 7. Check-ins this week
    const { data: checkins } = await supabase
      .from("weekly_checkins")
      .select("student_id, energy_level, sleep_quality, stress_level, muscle_soreness, week_start")
      .in("student_id", studentIds)
      .gte("week_start", wsStr)
      .lte("week_start", weStr);

    const checkinMap = new Map<string, any>();
    checkins?.forEach((c) => checkinMap.set(c.student_id, c));

    // 8. Swaps this week
    const { data: swaps } = await supabase
      .from("session_swaps")
      .select("student_id, id, created_at, original_day, new_day")
      .in("student_id", studentIds)
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", weekEnd.toISOString());

    const swapCountMap = new Map<string, number>();
    swaps?.forEach((s) => swapCountMap.set(s.student_id, (swapCountMap.get(s.student_id) || 0) + 1));

    // 9. External sessions this week
    const { data: externals } = await supabase
      .from("external_sessions")
      .select("student_id, id, activity_type, date")
      .in("student_id", studentIds)
      .gte("date", wsStr)
      .lte("date", weStr);

    // 10. Sessions total per student (batched: 2 queries instead of N*2)
    let sessionsPerStudent = new Map<string, number>();
    if (programs && programs.length > 0) {
      const programIds = programs.map((p) => p.id);
      
      // Single query: get all first weeks
      const { data: allFirstWeeks } = await supabase
        .from("program_weeks")
        .select("id, program_id, week_number")
        .in("program_id", programIds)
        .order("week_number");

      // De-duplicate: keep only the first week per program
      const firstWeekByProgram = new Map<string, string>();
      allFirstWeeks?.forEach((w) => {
        if (!firstWeekByProgram.has(w.program_id)) {
          firstWeekByProgram.set(w.program_id, w.id);
        }
      });

      const firstWeekIds = [...firstWeekByProgram.values()];
      if (firstWeekIds.length > 0) {
        // Single query: get all sessions for those weeks
        const { data: allSessions } = await supabase
          .from("sessions")
          .select("week_id")
          .in("week_id", firstWeekIds);

        // Count sessions per week_id
        const countByWeekId = new Map<string, number>();
        allSessions?.forEach((s) => {
          countByWeekId.set(s.week_id, (countByWeekId.get(s.week_id) || 0) + 1);
        });

        // Map back to student_id
        programs.forEach((prog) => {
          const weekId = firstWeekByProgram.get(prog.id);
          if (weekId) {
            sessionsPerStudent.set(prog.student_id, countByWeekId.get(weekId) || 0);
          }
        });
      }
    }

    // Build student overviews
    const studentOverviews: StudentOverview[] = (profiles || []).map((profile) => {
      const prog = programs?.find((p) => p.student_id === profile.user_id);
      const weekInfo = prog ? programWeekMap.get(prog.id) : null;
      const doneThisWeek = completedSessions?.filter((cs) => cs.student_id === profile.user_id).length || 0;
      const totalSessions = sessionsPerStudent.get(profile.user_id) || 0;
      const lastSession = lastSessionMap.get(profile.user_id) || null;
      const checkin = checkinMap.get(profile.user_id);
      const swapCount = swapCountMap.get(profile.user_id) || 0;

      // Compute alerts
      const alerts: string[] = [];
      if (lastSession) {
        const daysSince = differenceInDays(now, new Date(lastSession));
        if (daysSince >= 5) alerts.push("no_session_5d");
      } else {
        alerts.push("no_session_5d");
      }
      if (!checkin) alerts.push("no_checkin");
      if (checkin && (checkin.energy_level <= 2 || checkin.stress_level >= 4)) alerts.push("high_fatigue");
      if (swapCount > 0) alerts.push("swaps");

      return {
        id: profile.user_id,
        userId: profile.user_id,
        name: profile.full_name,
        avatar: profile.full_name.charAt(0).toUpperCase(),
        goal: profile.goal,
        level: profile.level,
        programName: prog?.name || null,
        programWeekCurrent: 1, // simplified
        programWeekTotal: weekInfo?.total || null,
        sessionsDone: doneThisWeek,
        sessionsTotal: totalSessions,
        lastSessionDate: lastSession,
        checkin: checkin
          ? { energy: checkin.energy_level, sleep: checkin.sleep_quality, stress: checkin.stress_level, soreness: checkin.muscle_soreness }
          : null,
        alerts,
        swapsThisWeek: swapCount,
        substitutionsThisWeek: 0,
      };
    });

    // Build activity feed
    const feedItems: ActivityItem[] = [];

    completedSessions?.forEach((cs) => {
      const p = profiles?.find((pr) => pr.user_id === cs.student_id);
      if (p) {
        feedItems.push({
          id: cs.id,
          type: "session_completed",
          studentName: p.full_name,
          avatar: p.full_name.charAt(0).toUpperCase(),
          detail: "",
          timestamp: cs.started_at,
        });
      }
    });

    checkins?.forEach((c) => {
      const p = profiles?.find((pr) => pr.user_id === c.student_id);
      if (p) {
        feedItems.push({
          id: `checkin-${c.student_id}`,
          type: "checkin",
          studentName: p.full_name,
          avatar: p.full_name.charAt(0).toUpperCase(),
          detail: `⚡${c.energy_level}`,
          timestamp: c.week_start,
        });
      }
    });

    swaps?.forEach((s) => {
      const p = profiles?.find((pr) => pr.user_id === s.student_id);
      if (p) {
        feedItems.push({
          id: s.id,
          type: "swap",
          studentName: p.full_name,
          avatar: p.full_name.charAt(0).toUpperCase(),
          detail: "",
          timestamp: s.created_at,
        });
      }
    });

    externals?.forEach((e) => {
      const p = profiles?.find((pr) => pr.user_id === e.student_id);
      if (p) {
        feedItems.push({
          id: e.id,
          type: "external",
          studentName: p.full_name,
          avatar: p.full_name.charAt(0).toUpperCase(),
          detail: e.activity_type,
          timestamp: e.date,
        });
      }
    });

    feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Compute KPIs
    const totalAlerts = studentOverviews.reduce((sum, s) => sum + s.alerts.filter(a => a !== "swaps").length, 0);
    const avgAdherence = studentOverviews.length > 0
      ? Math.round(
          studentOverviews
            .filter((s) => s.sessionsTotal > 0)
            .reduce((sum, s) => sum + (s.sessionsDone / s.sessionsTotal) * 100, 0) /
          Math.max(studentOverviews.filter((s) => s.sessionsTotal > 0).length, 1)
        )
      : 0;

    setStudents(studentOverviews);
    setKpis({
      activeStudents: studentOverviews.length,
      sessionsThisWeek: completedSessions?.length || 0,
      avgAdherence,
      alertCount: totalAlerts,
    });
    setFeed(feedItems.slice(0, 20));
    setLoading(false);
  };

  return { students, kpis, feed, loading };
};
