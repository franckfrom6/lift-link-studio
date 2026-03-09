import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateBadgeVariant = "rest" | "today" | "active" | "completed";

interface DateBadgeProps {
  day: number;
  dayName: string;
  variant: DateBadgeVariant;
  className?: string;
}

const variantStyles: Record<DateBadgeVariant, { badge: string; day: string }> = {
  rest: {
    badge: "bg-secondary text-muted-foreground",
    day: "text-muted-foreground",
  },
  today: {
    badge: "bg-primary text-primary-foreground",
    day: "text-primary",
  },
  active: {
    badge: "bg-card text-foreground ring-1 ring-border",
    day: "text-foreground",
  },
  completed: {
    badge: "bg-success-bg text-success",
    day: "text-success",
  },
};

const DateBadge = ({ day, dayName, variant, className }: DateBadgeProps) => {
  const styles = variantStyles[variant];

  return (
    <div className={cn("flex flex-col items-center gap-0.5 shrink-0", className)}>
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center relative",
          styles.badge
        )}
      >
        <span className="text-lg font-bold leading-none">{day}</span>
        {variant === "completed" && (
          <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-success fill-success-bg" strokeWidth={2} />
        )}
      </div>
      <span className={cn("text-[11px] font-medium leading-none", styles.day)}>
        {dayName}
      </span>
    </div>
  );
};

export default DateBadge;
