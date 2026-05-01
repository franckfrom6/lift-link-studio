import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FoodCategory, FoodUnit } from "@/lib/nutrition-macros";

export interface FoodRow {
  id: string;
  name_fr: string;
  name_en: string;
  category: FoodCategory;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  default_unit: FoodUnit;
  is_system: boolean;
  created_by: string | null;
}

export interface MealFoodRow {
  id: string;
  meal_id: string;
  food_id: string;
  quantity: number;
  unit: FoodUnit;
  order_index: number;
  notes: string | null;
  food: FoodRow | null;
}

export interface MealRow {
  id: string;
  plan_id: string;
  name: string;
  time_target: string | null;
  order_index: number;
  notes: string | null;
  meal_foods: MealFoodRow[];
}

export interface MealPlanRow {
  id: string;
  student_id: string;
  coach_id: string | null;
  name: string;
  notes: string | null;
  status: "active" | "archived";
  athlete_can_edit: boolean;
  target_kcal: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  meals: MealRow[];
}

const PLAN_QK = (studentId: string) => ["meal-plan", studentId] as const;

/**
 * Read the active meal plan for a student, with all meals and chips
 * joined. Returns null when the athlete has no plan yet.
 */
export function useMealPlan(studentId: string | null) {
  return useQuery({
    queryKey: PLAN_QK(studentId || ""),
    enabled: !!studentId,
    staleTime: 15_000,
    queryFn: async (): Promise<MealPlanRow | null> => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("meal_plans")
        .select(`
          id, student_id, coach_id, name, notes, status, athlete_can_edit,
          target_kcal, target_protein_g, target_carbs_g, target_fat_g,
          meals:meals (
            id, plan_id, name, time_target, order_index, notes,
            meal_foods:meal_foods (
              id, meal_id, food_id, quantity, unit, order_index, notes,
              food:foods (
                id, name_fr, name_en, category,
                kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
                fiber_per_100g, default_unit, is_system, created_by
              )
            )
          )
        `)
        .eq("student_id", studentId)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Sort meals + chips by order_index for stable display.
      const meals = ((data.meals || []) as MealRow[])
        .map((m) => ({
          ...m,
          meal_foods: (m.meal_foods || []).sort(
            (a, b) => a.order_index - b.order_index
          ),
        }))
        .sort((a, b) => a.order_index - b.order_index);

      return { ...(data as MealPlanRow), meals };
    },
  });
}

/** Invalidate helper to keep callers ergonomic. */
export function useInvalidateMealPlan() {
  const qc = useQueryClient();
  return (studentId: string) =>
    qc.invalidateQueries({ queryKey: PLAN_QK(studentId) });
}

/**
 * Subscribe to realtime changes on meal_plans / meals / meal_foods that
 * concern this student. Any change triggers a single React Query
 * invalidation so the editor refetches and re-renders.
 *
 * - meal_plans: filter by student_id directly.
 * - meals + meal_foods: we cannot filter server-side by student_id
 *   (no FK column on those rows), so we accept all events on those
 *   tables and let RLS already restrict what we'd receive in practice.
 *   Cheap to invalidate; the query is cached.
 */
export function useMealPlanRealtime(studentId: string | null, onRemoteChange?: () => void) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`meal-plan-${studentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meal_plans", filter: `student_id=eq.${studentId}` },
        () => { qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }); onRemoteChange?.(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meals" },
        () => { qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }); onRemoteChange?.(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meal_foods" },
        () => { qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }); onRemoteChange?.(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [studentId, qc, onRemoteChange]);
}

// ---------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------

/** Create the (single) active plan for a student. */
export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      studentId: string;
      coachId: string | null;
      name?: string;
    }) => {
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          student_id: input.studentId,
          coach_id: input.coachId,
          name: input.name || "Plan nutritionnel",
        })
        .select("id")
        .single();
      if (error) {
        // Unique violation = the athlete already has an active plan.
        // Surface a friendly FR message so the UI can react.
        if ((error as any).code === "23505") {
          const e = new Error("Cet athlète a déjà un plan actif.");
          (e as any).code = "PLAN_ALREADY_EXISTS";
          throw e;
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: PLAN_QK(vars.studentId) }),
  });
}

export function useUpdatePlan(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { planId: string; patch: Partial<MealPlanRow> }) => {
      const { error } = await supabase
        .from("meal_plans")
        .update(input.patch as any)
        .eq("id", input.planId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}

export function useAddMeal(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { planId: string; name: string; orderIndex: number }) => {
      const { error } = await supabase.from("meals").insert({
        plan_id: input.planId,
        name: input.name,
        order_index: input.orderIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}

export function useUpdateMeal(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { mealId: string; patch: Partial<MealRow> }) => {
      const { error } = await supabase
        .from("meals")
        .update(input.patch as any)
        .eq("id", input.mealId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}

export function useDeleteMeal(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { mealId: string }) => {
      const { error } = await supabase.from("meals").delete().eq("id", input.mealId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}

export function useDuplicateMeal(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { meal: MealRow; newOrderIndex: number; newName?: string }) => {
      // 1) clone the meal row
      const { data: newMeal, error: e1 } = await supabase
        .from("meals")
        .insert({
          plan_id: input.meal.plan_id,
          name: input.newName ?? `${input.meal.name} (copie)`,
          time_target: input.meal.time_target,
          order_index: input.newOrderIndex,
          notes: input.meal.notes,
        })
        .select("id")
        .single();
      if (e1) throw e1;
      // 2) clone its chips
      if (input.meal.meal_foods.length > 0) {
        const rows = input.meal.meal_foods.map((mf, i) => ({
          meal_id: newMeal.id,
          food_id: mf.food_id,
          quantity: mf.quantity,
          unit: mf.unit,
          order_index: i,
          notes: mf.notes,
        }));
        const { error: e2 } = await supabase.from("meal_foods").insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}

export function useAddMealFood(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      mealId: string;
      foodId: string;
      quantity: number;
      unit: FoodUnit;
      orderIndex: number;
      notes?: string | null;
    }) => {
      const { error } = await supabase.from("meal_foods").insert({
        meal_id: input.mealId,
        food_id: input.foodId,
        quantity: input.quantity,
        unit: input.unit,
        order_index: input.orderIndex,
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}

export function useUpdateMealFood(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      mealFoodId: string;
      patch: Partial<Pick<MealFoodRow, "quantity" | "unit" | "notes" | "order_index">>;
    }) => {
      const { error } = await supabase
        .from("meal_foods")
        .update(input.patch as any)
        .eq("id", input.mealFoodId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}

export function useDeleteMealFood(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { mealFoodId: string }) => {
      const { error } = await supabase
        .from("meal_foods")
        .delete()
        .eq("id", input.mealFoodId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_QK(studentId) }),
  });
}