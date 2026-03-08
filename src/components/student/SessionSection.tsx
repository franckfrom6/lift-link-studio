import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionSectionProps {
  name: string;
  icon?: string | null;
  durationEstimate?: string | null;
  notes?: string | null;
  isActive?: boolean;
  children: React.ReactNode;
}

const SessionSection = ({ name, icon, durationEstimate, notes, isActive, children }: SessionSectionProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={cn(
      "rounded-xl border transition-colors",
      isActive ? "border-primary/30 bg-card" : "border-border/50 bg-card/60"
    )}>
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {icon && <span className="text-lg">{icon}</span>}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-display font-bold text-sm",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}>
            {name}
          </h3>
          {durationEstimate && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{durationEstimate}</span>
            </div>
          )}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          expanded && "rotate-180"
        )} />
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {notes && (
            <p className="text-xs text-muted-foreground italic leading-relaxed px-1">
              {notes}
            </p>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default SessionSection;
