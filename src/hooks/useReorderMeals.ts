/**
 * Batch update of meal & meal_food order_index (PR3 DnD).
 *
 * Strategy: collect the new ordering at drag end, build an array of
 * `{ id, order_index }` updates, fire them in parallel. We DO NOT
 * reorder optimistically here — the UI keeps a local visual order
 * during the drag (via dnd-kit) and we just persist the final result.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PLAN_QK = (studentId: string) => ["meal-plan", studentId] as const;

export function useReorderMeals(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      // One UPDATE per row; small N (<20 meals typically), so parallel is fine.
      const results = await Promise.all(
        updates.map((u) =>
          supabase.from("meals").update({ order_index: u.order_index }).eq("id", u.id)
        )
      );
      const firstErr = results.find((r) => r.error)?.error;
      if (firstErr) throw firstErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}

export function useReorderMealFoods(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      const results = await Promise.all(
        updates.map((u) =>
          supabase.from("meal_foods").update({ order_index: u.order_index }).eq("id", u.id)
        )
      );
      const firstErr = results.find((r) => r.error)?.error;
      if (firstErr) throw firstErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}