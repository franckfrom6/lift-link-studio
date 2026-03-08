import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DraggableDayCardProps {
  dayIndex: number;
  hasSession: boolean;
  children: ReactNode;
  className?: string;
}

export const DraggableDayCard = ({ dayIndex, hasSession, children, className }: DraggableDayCardProps) => {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `day-${dayIndex}`,
    data: { dayIndex },
    disabled: !hasSession,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${dayIndex}`,
    data: { dayIndex },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
    : undefined;

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        className,
        isDragging && "opacity-50 shadow-lg scale-[1.02]",
        isOver && !isDragging && "ring-2 ring-primary/50 bg-primary/5",
      )}
    >
      {children}
    </div>
  );
};
