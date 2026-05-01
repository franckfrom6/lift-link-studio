import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FoodRow } from "./useMealPlan";
import type { FoodCategory } from "@/lib/nutrition-macros";

/**
 * Search foods by name (FR or EN), optionally filtered by category and
 * "mine only". RLS handles visibility (system + own + coach/athlete shared).
 * Results are sorted system-first then alphabetically — coaches usually
 * want to spot their custom items quickly via the "Mes aliments" tab.
 */
export function useFoodSearch(opts: {
  query: string;
  category?: FoodCategory | null;
  mineOnly?: boolean;
  enabled?: boolean;
}) {
  const { query, category, mineOnly, enabled = true } = opts;
  return useQuery({
    queryKey: ["food-search", query, category ?? "_", mineOnly ? "mine" : "all"],
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<FoodRow[]> => {
      let q = supabase
        .from("foods")
        .select(
          "id, name_fr, name_en, category, kcal_per_100g, protein_per_100g, " +
          "carbs_per_100g, fat_per_100g, fiber_per_100g, default_unit, " +
          "is_system, created_by"
        )
        .order("is_system", { ascending: false })
        .order("name_fr", { ascending: true })
        .limit(80);

      if (category) q = q.eq("category", category);
      if (mineOnly) {
        const { data: u } = await supabase.auth.getUser();
        if (u.user?.id) q = q.eq("created_by", u.user.id);
        else return [];
      }
      if (query.trim().length > 0) {
        const safe = query.trim().replace(/[%_]/g, "\\$&");
        q = q.or(`name_fr.ilike.%${safe}%,name_en.ilike.%${safe}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as FoodRow[];
    },
  });
}

/**
 * Find foods with macros within ±tolerance% of the source food, used
 * for the "Replace by…" substitution flow. Tolerance defaults to 10 %.
 */
export function useEquivalentFoods(opts: {
  source: FoodRow | null;
  tolerancePct?: number;
  enabled?: boolean;
}) {
  const { source, tolerancePct = 10, enabled = true } = opts;
  return useQuery({
    queryKey: ["food-equivalents", source?.id, tolerancePct],
    enabled: enabled && !!source,
    staleTime: 60_000,
    queryFn: async (): Promise<FoodRow[]> => {
      if (!source) return [];
      const t = tolerancePct / 100;
      const range = (v: number) => ({ lo: v * (1 - t), hi: v * (1 + t) });
      const k = range(source.kcal_per_100g);
      const p = range(source.protein_per_100g);
      const c = range(source.carbs_per_100g);
      const f = range(source.fat_per_100g);
      const { data, error } = await supabase
        .from("foods")
        .select(
          "id, name_fr, name_en, category, kcal_per_100g, protein_per_100g, " +
          "carbs_per_100g, fat_per_100g, fiber_per_100g, default_unit, " +
          "is_system, created_by"
        )
        .eq("category", source.category)
        .neq("id", source.id)
        .gte("kcal_per_100g", k.lo).lte("kcal_per_100g", k.hi)
        .gte("protein_per_100g", p.lo).lte("protein_per_100g", p.hi)
        .gte("carbs_per_100g", c.lo).lte("carbs_per_100g", c.hi)
        .gte("fat_per_100g", f.lo).lte("fat_per_100g", f.hi)
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as FoodRow[];
    },
  });
}