import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { formatLocalDate } from "@/lib/date-utils";

export interface SessionSwap {
  id: string;
  session_id: string;
  student_id: string;
  original_day: number;
  new_day: number;
  original_date: string;
  new_date: string;
  reason: string | null;
  created_at: string;
}

export const useSessionSwaps = (weekStartDate?: Date) => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;
  const [swaps, setSwaps] = useState<SessionSwap[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSwaps = useCallback(async () => {
    if (!studentId || !weekStartDate) return;
    setLoading(true);

    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const { data, error } = await supabase
      .from("session_swaps")
      .select("*")
      .eq("student_id", studentId)
      .gte("new_date", formatLocalDate(weekStartDate))
      .lte("new_date", formatLocalDate(weekEnd));

    if (!error && data) {
      setSwaps(data as SessionSwap[]);
    }
    setLoading(false);
  }, [studentId, weekStartDate]);

  useEffect(() => {
    (async () => {
      try {
        await fetchSwaps();
      } catch (err) {
        console.error("Fetch error:", err);
      }
    })();
  }, [fetchSwaps]);

  // Realtime subscription
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel("session-swaps-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "session_swaps",
        filter: `student_id=eq.${studentId}`,
      }, () => {
        fetchSwaps();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId, fetchSwaps]);

  const createSwap = async (params: {
    sessionId: string;
    originalDay: number;
    newDay: number;
    originalDate: Date;
    newDate: Date;
    reason?: string;
  }) => {
    if (!studentId) return null;

    const { data, error } = await supabase
      .from("session_swaps")
      .insert({
        session_id: params.sessionId,
        student_id: studentId,
        original_day: params.originalDay,
        new_day: params.newDay,
        original_date: params.originalDate.toISOString().split("T")[0],
        new_date: params.newDate.toISOString().split("T")[0],
        reason: params.reason || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating swap:", error);
      return null;
    }
    return data as SessionSwap;
  };

  return { swaps, loading, createSwap, refetch: fetchSwaps };
};
