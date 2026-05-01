import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import MealCard from "./MealCard";
import type { MealRow } from "@/hooks/useMealPlan";

interface Props {
  meal: MealRow;
  readOnly?: boolean;
  onRename?: (name: string, time: string | null) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddFood?: () => void;
  onRemoveFood?: (mealFoodId: string) => void;
  onEditFood?: (mealFoodId: string) => void;
  onSubstituteFood?: (mealFoodId: string) => void;
  /** Optional slot rendered inside the card (used for nested chip DnD context). */
  childrenOverride?: React.ReactNode;
}

/**
 * MealCard with a left-side drag handle for vertical reordering.
 * The handle is the ONLY surface that activates the drag — the rest of
 * the card keeps its menus, taps, etc.
 */
const SortableMealCard = (props: Props) => {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: props.meal.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  if (props.readOnly) {
    return <MealCard {...props} />;
  }

  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-stretch gap-2")}>
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Réordonner ce repas"
        className="flex items-center justify-center w-7 shrink-0 rounded-lg border border-border bg-card text-muted-foreground/70 hover:text-foreground hover:bg-muted touch-none cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <MealCard {...props} />
      </div>
    </div>
  );
};

export default SortableMealCard;