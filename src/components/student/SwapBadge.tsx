import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DAY_NAMES: Record<number, string> = {
  1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi", 7: "Dimanche",
};

interface SwapBadgeProps {
  originalDay: number;
  newDay: number;
  reason?: string | null;
  className?: string;
  variant?: "compact" | "full";
}

const SwapBadge = ({ originalDay, newDay, reason, className, variant = "compact" }: SwapBadgeProps) => {
  const badge = (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
      "bg-warning-bg text-warning",
      className
    )}>
      <ArrowLeftRight className="w-3 h-3" strokeWidth={1.5} />
      {variant === "full" && (
        <span>{DAY_NAMES[originalDay]} → {DAY_NAMES[newDay]}</span>
      )}
    </div>
  );

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            <p className="font-medium">Déplacée : {DAY_NAMES[originalDay]} → {DAY_NAMES[newDay]}</p>
            {reason && <p className="text-muted-foreground mt-0.5">{reason}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

export default SwapBadge;
