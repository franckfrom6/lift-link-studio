/**
 * Pending change-requests count for a coach (PR3 in-app notif).
 *
 * - Returns the current count of `meal_plan_change_requests` with
 *   `status = 'pending'` addressed to the signed-in coach.
 * - Subscribes to realtime changes on the table, filtered server-side
 *   by `coach_id`, so the badge updates without polling.
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const QK = (coachId: string) => ["change-requests-count", coachId] as const;

export function useChangeRequestsCount() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: QK(user?.id || ""),
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("meal_plan_change_requests")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    const ch = supabase
      .channel(`change-requests-${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meal_plan_change_requests",
          filter: `coach_id=eq.${uid}`,
        },
        () => qc.invalidateQueries({ queryKey: QK(uid) })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, qc]);

  return query;
}