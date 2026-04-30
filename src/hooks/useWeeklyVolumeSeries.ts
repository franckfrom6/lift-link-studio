import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { startOfWeek, addWeeks, format } from "date-fns";

export type ProgPeriod = "4w" | "12w" | "1y";

interface VolumeSeries {
  points: number[];      // weekly totals, oldest → newest
  labels: string[];      // matching ISO week starts (yyyy-MM-dd)
  current: number;       // last week total
  previous: number;      // previous week total
}

const PERIOD_WEEKS: Record<ProgPeriod, number> = { "4w": 4, "12w": 12, "1y": 52 };

/**
 * Returns total weight*reps volume per ISO-week (Mon→Sun) for the requested
 * period. Buckets are computed locally so the chart works even with sparse data.
 */
async function fetchWeeklyVolume(studentId: string, period: ProgPeriod): Promise<VolumeSeries> {
  const weeks = PERIOD_WEEKS[period];
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const firstWeekStart = addWeeks(thisWeekStart, -(weeks - 1));

  const { data: completed } = await supabase
    .from("completed_sessions")
    .select("id, started_at")
    .eq("student_id", studentId)
    .gte("started_at", firstWeekStart.toISOString());

  const points = new Array(weeks).fill(0);
  const labels = new Array(weeks).fill("").map((_, i) =>
    format(addWeeks(firstWeekStart, i), "yyyy-MM-dd")
  );

  if (!completed || completed.length === 0) {
    return { points, labels, current: 0, previous: 0 };
  }

  // Fetch sets for those sessions in one shot
  const csIds = completed.map((c) => c.id);
  const { data: sets } = await supabase
    .from("completed_sets")
    .select("completed_session_id, weight, reps")
    .in("completed_session_id", csIds);

  if (!sets) return { points, labels, current: 0, previous: 0 };

  // Map session → week index
  const sessionWeekIdx = new Map<string, number>();
  for (const cs of completed) {
    const ws = startOfWeek(new Date(cs.started_at), { weekStartsOn: 1 });
    const idx = Math.round(
      (ws.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    if (idx >= 0 && idx < weeks) sessionWeekIdx.set(cs.id, idx);
  }

  for (const s of sets) {
    const idx = sessionWeekIdx.get(s.completed_session_id);
    if (idx === undefined) continue;
    points[idx] += (s.weight || 0) * (s.reps || 0);
  }

  const rounded = points.map((v) => Math.round(v));
  return {
    points: rounded,
    labels,
    current: rounded[rounded.length - 1] || 0,
    previous: rounded[rounded.length - 2] || 0,
  };
}

export const useWeeklyVolumeSeries = (period: ProgPeriod) => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-volume", studentId, period],
    queryFn: () => fetchWeeklyVolume(studentId!, period),
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });

  return {
    series: data ?? { points: [], labels: [], current: 0, previous: 0 },
    loading: isLoading,
  };
};