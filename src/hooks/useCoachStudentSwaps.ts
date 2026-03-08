import { useState, useEffect } from "react";
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
  const [swaps, setSwaps] = useState<StudentSwap[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("session_swaps")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) setSwaps(data as StudentSwap[]);
      setLoading(false);
    };

    (async () => {
      try {
        await fetchData();
      } catch (err) {
        console.error("Fetch error:", err);
      }
    })();

    // Realtime
    const channel = supabase
      .channel(`coach-swaps-${studentId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "session_swaps",
        filter: `student_id=eq.${studentId}`,
      }, () => { fetchData().catch(console.error); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  return { swaps, loading };
};
