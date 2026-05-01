import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Repeat } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_CHIP_CLASSES, computeEntryMacros, type FoodCategory,
} from "@/lib/nutrition-macros";
import { cn } from "@/lib/utils";
import { useEquivalentFoods } from "@/hooks/useFoodSearch";
import type { MealFoodRow, FoodRow } from "@/hooks/useMealPlan";

interface SubstituteFoodSheetProps {
  open: boolean;
  entry: MealFoodRow | null;
  onClose: () => void;
  onSubstitute: (food: FoodRow) => void;
  onOpenManualPicker: () => void;
}

/**
 * Long-press on a chip → suggest macro-equivalent foods.
 * Strict tolerance first (±10 % kcal & protein, same category);
 * if fewer than 3 hits, widen to ±20 % and surface a discreet warning.
 */
const SubstituteFoodSheet = ({
  open, entry, onClose, onSubstitute, onOpenManualPicker,
}: SubstituteFoodSheetProps) => {
  const { i18n } = useTranslation();
  const isFr = (i18n.language || "fr").startsWith("fr");
  const [widened, setWidened] = useState(false);

  const food = entry?.food ?? null;
  const tolerance = widened ? 20 : 10;

  const { data: results = [], isLoading } = useEquivalentFoods({
    source: food,
    tolerancePct: tolerance,
    enabled: open && !!food,
  });

  // Auto-widen when the strict result set is too small.
  if (open && !widened && !isLoading && results.length < 3 && food) {
    setTimeout(() => setWidened(true), 0);
  }

  const sourceMacros = food && entry
    ? computeEntryMacros(food, entry.quantity, entry.unit)
    : null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { onClose(); setWidened(false); } }}>
      <SheetContent side="bottom" className="h-[80dvh] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-base flex items-center gap-2">
            <Repeat className="w-4 h-4 text-muted-foreground" />
            Remplacer par…
          </SheetTitle>
          {food && sourceMacros && (
            <p className="text-[11px] text-muted-subtle">
              {isFr ? food.name_fr : food.name_en} ·{" "}
              <span className="tabular-nums">{Math.round(sourceMacros.kcal)} kcal · P {Math.round(sourceMacros.protein)}g</span>
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 px-4 space-y-3">
              <p className="text-xs text-muted-subtle">
                Aucune substitution équivalente trouvée pour cet aliment.
              </p>
              <Button variant="outline" size="sm" onClick={() => { onClose(); onOpenManualPicker(); }}>
                Choisir manuellement
              </Button>
            </div>
          ) : (
            <>
              {widened && (
                <p className="px-3 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-md mx-2 mb-2">
                  Substitutions approximatives (tolérance élargie à ±20 %)
                </p>
              )}
              <ul className="divide-y divide-border">
                {results.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => { onSubstitute(f); onClose(); setWidened(false); }}
                      className="w-full px-3 py-2.5 text-left hover:bg-muted/50 active:bg-muted rounded-md flex items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {isFr ? f.name_fr : f.name_en}
                        </p>
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0 mt-0.5 rounded-full border text-[10px] font-semibold",
                          CATEGORY_CHIP_CLASSES[f.category as FoodCategory],
                        )}>
                          {f.kcal_per_100g}kcal · P{f.protein_per_100g}g · G{f.carbs_per_100g}g · L{f.fat_per_100g}g /100{f.default_unit === "ml" ? "ml" : "g"}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="border-t px-4 py-3 pb-safe-nav">
          <Button variant="outline" className="w-full" onClick={() => { onClose(); onOpenManualPicker(); }}>
            Choisir un autre aliment manuellement
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SubstituteFoodSheet;