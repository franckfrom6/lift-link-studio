import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentSwap {
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

export const useCoachStudentSwaps = (studentId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['coach-student-swaps', studentId];

  const { data: swaps = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_swaps")
        .select("*")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as StudentSwap[]) || [];
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  });

  // Realtime filtered by student_id
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`coach-swaps-rt-${studentId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "session_swaps",
        filter: `student_id=eq.${studentId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId, queryClient]);

  return { swaps, loading };
};
