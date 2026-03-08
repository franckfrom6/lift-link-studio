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

const getSectionBorderColor = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("warm") || lower.includes("échauffement")) return "border-l-tag-orange";
  if (lower.includes("cool") || lower.includes("retour")) return "border-l-tag-blue";
  return "border-l-tag-violet";
};

const SessionSection = ({ name, icon, durationEstimate, notes, isActive, children }: SessionSectionProps) => {
  const [expanded, setExpanded] = useState(true);
  const borderColor = getSectionBorderColor(name);

  return (
    <div className={cn(
      "rounded-xl border transition-colors overflow-hidden",
      isActive ? "border-border bg-card" : "border-border/50 bg-card"
    )}>
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left bg-secondary/50 border-b border-border/50"
      >
        {icon && <span className="text-lg">{icon}</span>}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-sm uppercase tracking-[0.05em]",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}>
            {name}
          </h3>
          {durationEstimate && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[11px] text-muted-foreground">{durationEstimate}</span>
            </div>
          )}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform duration-200",
          expanded && "rotate-180"
        )} strokeWidth={1.5} />
      </button>

      {expanded && (
        <div className={cn("px-3 pb-3 pt-2 space-y-2 border-l-2", borderColor)}>
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
