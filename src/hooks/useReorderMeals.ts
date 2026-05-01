/**
 * Batch update of meal & meal_food order_index (PR3 DnD).
 *
 * Strategy: collect the new ordering at drag end, build an array of
 * `{ id, order_index }` updates, fire them in parallel. The UI updates
 * optimistically via setQueryData so there is no visual "snap back"
 * between the drag end and the server roundtrip. On error we rollback
 * to the pre-drag snapshot.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MealPlanRow } from "@/hooks/useMealPlan";

const PLAN_QK = (studentId: string) => ["meal-plan", studentId] as const;

type ReorderUpdate = { id: string; order_index: number };

/** Apply a new order_index map to an array of items, then sort. */
function applyOrder<T extends { id: string; order_index: number }>(
  items: T[],
  updates: ReorderUpdate[]
): T[] {
  const map = new Map(updates.map((u) => [u.id, u.order_index] as const));
  return items
    .map((it) => (map.has(it.id) ? { ...it, order_index: map.get(it.id)! } : it))
    .sort((a, b) => a.order_index - b.order_index);
}

export function useReorderMeals(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    onMutate: async (updates: ReorderUpdate[]) => {
      await qc.cancelQueries({ queryKey: PLAN_QK(studentId) });
      const prev = qc.getQueryData<MealPlanRow | null>(PLAN_QK(studentId));
      if (prev) {
        qc.setQueryData<MealPlanRow>(PLAN_QK(studentId), {
          ...prev,
          meals: applyOrder(prev.meals, updates),
        });
      }
      return { prev };
    },
    mutationFn: async (updates: ReorderUpdate[]) => {
      // One UPDATE per row; small N (<20 meals typically), so parallel is fine.
      const results = await Promise.all(
        updates.map((u) =>
          supabase.from("meals").update({ order_index: u.order_index }).eq("id", u.id)
        )
      );
      const firstErr = results.find((r) => r.error)?.error;
      if (firstErr) throw firstErr;
    },
    onError: (_err, _vars, ctx) => {
      // Rollback to pre-drag state.
      if (ctx?.prev !== undefined) {
        qc.setQueryData(PLAN_QK(studentId), ctx.prev);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}

export function useReorderMealFoods(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    onMutate: async (updates: ReorderUpdate[]) => {
      await qc.cancelQueries({ queryKey: PLAN_QK(studentId) });
      const prev = qc.getQueryData<MealPlanRow | null>(PLAN_QK(studentId));
      if (prev) {
        qc.setQueryData<MealPlanRow>(PLAN_QK(studentId), {
          ...prev,
          meals: prev.meals.map((m) => ({
            ...m,
            meal_foods: applyOrder(m.meal_foods, updates),
          })),
        });
      }
      return { prev };
    },
    mutationFn: async (updates: ReorderUpdate[]) => {
      const results = await Promise.all(
        updates.map((u) =>
          supabase.from("meal_foods").update({ order_index: u.order_index }).eq("id", u.id)
        )
      );
      const firstErr = results.find((r) => r.error)?.error;
      if (firstErr) throw firstErr;
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(PLAN_QK(studentId), ctx.prev);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}