import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ProgressionPhase {
  id: string;
  weekLabel: string;
  description: string;
  weekStart: number;
  weekEnd: number;
  isDeload: boolean;
  order: number;
}

interface ProgressionTimelineProps {
  phases: ProgressionPhase[];
  currentWeek?: number;
}

const ProgressionTimeline = ({ phases, currentWeek }: ProgressionTimelineProps) => {
  const sorted = [...phases].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-1">
      {sorted.map((phase, i) => {
        const isCurrent = currentWeek !== undefined && currentWeek >= phase.weekStart && currentWeek <= phase.weekEnd;
        const isPast = currentWeek !== undefined && currentWeek > phase.weekEnd;

        return (
          <div key={phase.id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-3 h-3 rounded-full shrink-0 mt-1.5 transition-colors",
                isCurrent && "bg-primary ring-2 ring-primary/30",
                isPast && "bg-primary/40",
                !isCurrent && !isPast && "bg-border",
                phase.isDeload && !isCurrent && "bg-warning/40"
              )} />
              {i < sorted.length - 1 && (
                <div className={cn(
                  "w-0.5 flex-1 min-h-[24px]",
                  isPast ? "bg-primary/30" : "bg-border"
                )} />
              )}
            </div>

            {/* Content */}
            <div className={cn(
              "pb-4 flex-1 rounded-lg px-3 py-2 -mt-0.5 transition-colors",
              isCurrent && "bg-accent border border-accent-foreground/10",
              phase.isDeload && !isCurrent && "bg-warning-bg"
            )}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "text-sm font-semibold",
                  isCurrent ? "text-accent-foreground" : "text-foreground"
                )}>
                  {phase.weekLabel}
                </span>
                {phase.isDeload && (
                  <Badge variant="outline" className="text-warning border-warning/30 text-[10px] px-1.5 py-0">
                    Deload
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="text-[10px] px-1.5 py-0">En cours</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {phase.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressionTimeline;
