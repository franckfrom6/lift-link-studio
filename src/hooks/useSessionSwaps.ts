import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";

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
    if (!user || !weekStartDate) return;
    setLoading(true);

    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const { data, error } = await supabase
      .from("session_swaps")
      .select("*")
      .eq("student_id", user.id)
      .gte("new_date", weekStartDate.toISOString().split("T")[0])
      .lte("new_date", weekEnd.toISOString().split("T")[0]);

    if (!error && data) {
      setSwaps(data as SessionSwap[]);
    }
    setLoading(false);
  }, [user, weekStartDate]);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("session-swaps-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "session_swaps",
        filter: `student_id=eq.${user.id}`,
      }, () => {
        fetchSwaps();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSwaps]);

  const createSwap = async (params: {
    sessionId: string;
    originalDay: number;
    newDay: number;
    originalDate: Date;
    newDate: Date;
    reason?: string;
  }) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("session_swaps")
      .insert({
        session_id: params.sessionId,
        student_id: user.id,
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
