import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
  const queryClient = useQueryClient();
  const weekKey = weekStartDate ? formatLocalDate(weekStartDate) : null;

  const queryKeyArr = ['session-swaps', studentId, weekKey];

  const { data: swaps = [], isLoading: loading, refetch } = useQuery({
    queryKey: queryKeyArr,
    queryFn: async () => {
      const weekEnd = new Date(weekStartDate!);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const { data, error } = await supabase
        .from("session_swaps")
        .select("*")
        .eq("student_id", studentId!)
        .gte("new_date", formatLocalDate(weekStartDate!))
        .lte("new_date", formatLocalDate(weekEnd));
      if (error) throw error;
      return (data as SessionSwap[]) || [];
    },
    enabled: !!studentId && !!weekStartDate,
    staleTime: 30 * 1000,
  });

  // Realtime — already filtered by student_id
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`session-swaps-rt-${studentId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "session_swaps",
        filter: `student_id=eq.${studentId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['session-swaps', studentId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId, queryClient]);

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
        original_date: formatLocalDate(params.originalDate),
        new_date: formatLocalDate(params.newDate),
        reason: params.reason || null,
      })
      .select()
      .single();
    if (error) {
      console.error("Error creating swap:", error);
      return null;
    }
    queryClient.invalidateQueries({ queryKey: ['session-swaps', studentId] });
    return data as SessionSwap;
  };

  return { swaps, loading, createSwap, refetch: () => refetch() };
};
