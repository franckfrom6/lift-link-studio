/**
 * Nutrition macro computation utilities.
 *
 * All food values are stored *per 100 g/ml* in the `foods` table.
 * For chip-based meal entries we convert any (quantity, unit) pair back
 * to grams using a small conversion table, then scale the macros.
 *
 * Heuristic conversions are intentionally conservative:
 * - Liquids assume 1 ml ≈ 1 g (true for water/milk, close enough for the
 *   beverages we currently seed).
 * - "piece" returns the food's full per-100g values multiplied by a
 *   default piece weight (50 g) when no explicit weight is known. The
 *   caller can always switch the unit to "g" for precision.
 */

export type FoodUnit = "g" | "ml" | "piece" | "tbsp" | "tsp" | "cup";

export interface FoodMacroSource {
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface ComputedMacros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Approximate grams equivalent for one unit. */
const UNIT_TO_GRAMS: Record<FoodUnit, number> = {
  g: 1,
  ml: 1,        // assume density ≈ water for current seed list
  piece: 50,    // fallback weight per piece (egg, fruit) — overridable later
  tbsp: 15,     // ~15 ml/g for oils, peanut butter
  tsp: 5,
  cup: 240,
};

export function quantityToGrams(quantity: number, unit: FoodUnit): number {
  return Math.max(0, quantity) * UNIT_TO_GRAMS[unit];
}

/** Compute kcal/P/C/F for a single chip entry. */
export function computeEntryMacros(
  food: FoodMacroSource,
  quantity: number,
  unit: FoodUnit
): ComputedMacros {
  const grams = quantityToGrams(quantity, unit);
  const factor = grams / 100;
  return {
    kcal: round1(food.kcal_per_100g * factor),
    protein: round1(food.protein_per_100g * factor),
    carbs: round1(food.carbs_per_100g * factor),
    fat: round1(food.fat_per_100g * factor),
  };
}

/** Sum a list of computed macros into a single total. */
export function sumMacros(entries: ComputedMacros[]): ComputedMacros {
  return entries.reduce<ComputedMacros>(
    (acc, m) => ({
      kcal: round1(acc.kcal + m.kcal),
      protein: round1(acc.protein + m.protein),
      carbs: round1(acc.carbs + m.carbs),
      fat: round1(acc.fat + m.fat),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Localized, short label for a unit (FR-first since UI is FR). */
export function unitLabel(unit: FoodUnit): string {
  switch (unit) {
    case "g": return "g";
    case "ml": return "ml";
    case "piece": return "pc";
    case "tbsp": return "c. à s.";
    case "tsp": return "c. à c.";
    case "cup": return "tasse";
  }
}

/** All units, in the order we want to expose them in pickers. */
export const ALL_UNITS: FoodUnit[] = ["g", "ml", "piece", "tbsp", "tsp", "cup"];

// ---------------------------------------------------------------------
// Category visual mapping (chip color tokens)
// ---------------------------------------------------------------------
export type FoodCategory =
  | "protein" | "carb" | "fat" | "vegetable" | "fruit"
  | "dairy" | "beverage" | "supplement" | "other";

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  protein: "Protéines",
  carb: "Glucides",
  fat: "Lipides",
  vegetable: "Légumes",
  fruit: "Fruits",
  dairy: "Laitiers",
  beverage: "Boissons",
  supplement: "Compléments",
  other: "Autres",
};

/**
 * Tailwind classes for chip background + text per category.
 * Uses theme-aware palette tints so it works in both light and dark.
 * NOTE: these colors are NOT the brand-reserved primary — they are
 * categorical accents only, intentionally muted.
 */
export const CATEGORY_CHIP_CLASSES: Record<FoodCategory, string> = {
  protein:    "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  carb:       "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  fat:        "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  vegetable:  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  fruit:      "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
  dairy:      "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  beverage:   "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  supplement: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  other:      "bg-bg-tinted text-foreground border-border",
};