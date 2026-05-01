import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatLocalDate } from "@/lib/date-utils";

export interface MonthDaySummary {
  /** YYYY-MM-DD local */
  dateKey: string;
  /** Number of programmed sessions (from active program) */
  programmed: number;
  /** Number of athlete-created free sessions */
  free: number;
  /** Number of external (logged) activities */
  external: number;
  /** Number of sessions actually completed that day */
  completed: number;
  /** External activity types present that day (e.g. "running", "cycling") */
  externalTypes?: Set<string>;
}

/**
 * Aggregate session activity for every day of a given month.
 * Used by the monthly calendar grid to render dots/badges per day.
 *
 * Only counts data that lives directly on a date:
 *  - free sessions (sessions.is_free_session=true with free_session_date)
 *  - external activities
 *  - completed sessions (any kind, programmed included)
 *
 * Programmed sessions from a structured program are NOT exposed here
 * because their effective date is computed in the page from the
 * program's week layout — we only mark "completed" via completed_sessions.
 */
export function useMonthSessions(studentId: string | null, monthAnchor: Date) {
  // Range = first day of month .. last day of month (local)
  const { startKey, endKey } = useMemo(() => {
    const start = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    const end = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);
    return { startKey: formatLocalDate(start), endKey: formatLocalDate(end) };
  }, [monthAnchor]);

  const queryKey = ["month-sessions", studentId, startKey];

  const { data = new Map<string, MonthDaySummary>() } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!studentId) return new Map<string, MonthDaySummary>();

      const [freeRes, extRes, doneRes] = await Promise.all([
        supabase
          .from("sessions")
          .select("free_session_date")
          .eq("is_free_session", true)
          .eq("created_by", studentId)
          .eq("is_deleted", false)
          .gte("free_session_date", startKey)
          .lte("free_session_date", endKey),
        supabase
          .from("external_sessions")
          .select("date, activity_type")
          .eq("student_id", studentId)
          .gte("date", startKey)
          .lte("date", endKey),
        supabase
          .from("completed_sessions")
          .select("completed_at")
          .eq("student_id", studentId)
          .not("completed_at", "is", null)
          .gte("completed_at", `${startKey}T00:00:00`)
          .lte("completed_at", `${endKey}T23:59:59`),
      ]);

      const map = new Map<string, MonthDaySummary>();
      const get = (k: string): MonthDaySummary => {
        let v = map.get(k);
        if (!v) {
          v = { dateKey: k, programmed: 0, free: 0, external: 0, completed: 0 };
          map.set(k, v);
        }
        return v;
      };

      (freeRes.data || []).forEach((r: any) => {
        if (r.free_session_date) get(r.free_session_date).free += 1;
      });
      (extRes.data || []).forEach((r: any) => {
        if (r.date) {
          const day = get(r.date);
          day.external += 1;
          if (r.activity_type) {
            if (!day.externalTypes) day.externalTypes = new Set<string>();
            day.externalTypes.add(String(r.activity_type));
          }
        }
      });
      (doneRes.data || []).forEach((r: any) => {
        if (!r.completed_at) return;
        // completed_at is a timestamp — keep just the local date part
        const d = new Date(r.completed_at);
        get(formatLocalDate(d)).completed += 1;
      });

      return map;
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  });

  return { summaries: data };
}
