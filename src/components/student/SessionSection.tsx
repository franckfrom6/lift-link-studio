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

/**
 * Sage variant — sober collapsible section.
 * Sits visually between SessionPreview's SectionLabel and the exercise cards inside.
 */
const SessionSection = ({
  name,
  icon,
  durationEstimate,
  notes,
  isActive,
  children,
}: SessionSectionProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-2">
      {/* Section label — matches SectionLabel atom */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-1 flex items-center justify-between text-left group"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          {icon && <span className="text-sm leading-none">{icon}</span>}
          <span
            className={cn(
              "text-[10px] uppercase tracking-[0.12em] font-semibold transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground",
              "group-hover:text-foreground"
            )}
          >
            {name}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {durationEstimate && (
            <span className="inline-flex items-center gap-1 text-[10px] tabular-nums font-medium text-muted-subtle">
              <Clock className="w-2.5 h-2.5" strokeWidth={1.5} />
              {durationEstimate}
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted-subtle transition-transform duration-200",
              expanded && "rotate-180"
            )}
            strokeWidth={1.5}
          />
        </span>
      </button>

      {expanded && (
        <div className="space-y-2">
          {notes && (
            <div className="px-3 py-2 rounded-md bg-bg-tinted border border-border border-l-[3px] border-l-foreground/40">
              <p className="text-[12px] text-muted-foreground leading-relaxed">{notes}</p>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default SessionSection;
