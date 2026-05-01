import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import FoodChip from "./FoodChip";
import type { MealFoodRow } from "@/hooks/useMealPlan";

interface Props {
  entry: MealFoodRow;
  readOnly?: boolean;
  onTap?: () => void;
  onRemove?: () => void;
  onLongPress?: () => void;
}

/**
 * FoodChip wrapped with a dedicated drag handle (⋮⋮ on the left).
 * The handle owns dnd-kit listeners; the rest of the chip keeps its
 * tap / long-press semantics intact (substitution, edit, remove).
 */
const SortableFoodChip = ({ entry, readOnly, onTap, onRemove, onLongPress }: Props) => {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: entry.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
  };

  if (readOnly) {
    return <FoodChip entry={entry} readOnly onTap={onTap} />;
  }

  return (
    <div ref={setNodeRef} style={style} className={cn("inline-flex items-stretch")}>
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Réordonner cet aliment"
        className="flex items-center justify-center px-1 rounded-l-full border border-r-0 border-border/60 bg-muted/40 text-muted-foreground/70 hover:text-foreground hover:bg-muted touch-none cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <div className="[&>div]:rounded-l-none">
        <FoodChip
          entry={entry}
          onTap={onTap}
          onRemove={onRemove}
          onLongPress={onLongPress}
        />
      </div>
    </div>
  );
};

export default SortableFoodChip;