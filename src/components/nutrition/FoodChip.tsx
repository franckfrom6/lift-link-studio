import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_CHIP_CLASSES,
  computeEntryMacros,
  unitLabel,
  type FoodCategory,
} from "@/lib/nutrition-macros";
import type { MealFoodRow } from "@/hooks/useMealPlan";
import { useTranslation } from "react-i18next";

interface FoodChipProps {
  entry: MealFoodRow;
  /** Tap → opens edit sheet */
  onTap?: () => void;
  /** Tap on the cross → soft delete with undo */
  onRemove?: () => void;
  /** Read-only mode hides the cross and disables the tap */
  readOnly?: boolean;
}

/**
 * One food entry rendered as a chip.
 * Color = category, label = food name (localized), kcal shown small.
 */
const FoodChip = ({ entry, onTap, onRemove, readOnly }: FoodChipProps) => {
  const { i18n } = useTranslation();
  const food = entry.food;
  if (!food) return null;

  const isFr = (i18n.language || "fr").startsWith("fr");
  const name = isFr ? food.name_fr : food.name_en;
  const macros = computeEntryMacros(food, entry.quantity, entry.unit);
  const cat = food.category as FoodCategory;

  return (
    <div
      className={cn(
        "group inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full border text-xs font-medium",
        "transition-all duration-150 max-w-full",
        CATEGORY_CHIP_CLASSES[cat],
        !readOnly && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      )}
    >
      <button
        type="button"
        onClick={readOnly ? undefined : onTap}
        disabled={readOnly}
        className="flex items-center gap-1.5 min-w-0 focus-visible:outline-none"
      >
        <span className="truncate">{name}</span>
        <span className="tabular-nums opacity-70 shrink-0">
          {entry.quantity} {unitLabel(entry.unit)}
        </span>
        <span className="tabular-nums font-bold shrink-0">
          {Math.round(macros.kcal)} kcal
        </span>
      </button>
      {!readOnly && onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 p-1 rounded-full hover:bg-foreground/10 active:bg-foreground/20 shrink-0"
          aria-label="Retirer cet aliment"
        >
          <X className="w-3 h-3" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default FoodChip;