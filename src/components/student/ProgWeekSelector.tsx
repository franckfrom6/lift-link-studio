import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgWeekSelectorItem {
  num: number;          // 1-based week number
  completed: number;    // sessions done
  total: number;        // sessions total
  state: "past" | "current" | "future";
  note?: string;        // e.g. "Deload"
}

interface ProgWeekSelectorProps {
  weeks: ProgWeekSelectorItem[];
  current: number;       // 1-based
  onSelect: (num: number) => void;
  className?: string;
  /** When provided, renders a trailing "+" tile to append a new week. */
  onAddWeek?: () => void;
  /** Optional disabled state for the add button (e.g. saving). */
  addDisabled?: boolean;
}

/**
 * Sage Phase 4 — horizontal week strip.
 * Pure tokens. Current week uses --primary tint, past = check, future = dimmed.
 */
const ProgWeekSelector = ({ weeks, current, onSelect, className, onAddWeek, addDisabled }: ProgWeekSelectorProps) => {
  return (
    <div
      className={cn(
        "flex gap-1.5 overflow-x-auto py-3 px-4 -mx-4 border-b border-border scrollbar-none",
        className
      )}
    >
      {weeks.map((w) => {
        const isCurrent = w.num === current;
        const isPast = w.state === "past";
        const isFuture = w.state === "future";
        return (
          <button
            key={w.num}
            type="button"
            onClick={() => onSelect(w.num)}
            className={cn(
              "flex flex-col items-start gap-1 flex-shrink-0 min-w-[60px] px-2.5 py-2 rounded-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isCurrent
                ? "bg-primary/10 border border-primary"
                : "bg-card border border-border hover:bg-bg-tinted",
              isFuture && "opacity-60"
            )}
            aria-pressed={isCurrent}
            aria-label={`Semaine ${w.num}`}
          >
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-[0.06em]",
                isCurrent ? "text-primary" : "text-muted-subtle"
              )}
            >
              S{w.num}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-[13px] font-bold tabular-nums leading-none",
                  isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {w.completed}
                <span
                  className={cn(
                    "font-semibold opacity-70",
                    isCurrent ? "text-primary" : "text-muted-subtle"
                  )}
                >
                  /{w.total}
                </span>
              </span>
              {isPast && <Check className="w-2.5 h-2.5 text-muted-foreground" strokeWidth={2.5} />}
            </div>
            {w.note && (
              <span className="text-[8px] uppercase tracking-[0.08em] text-muted-subtle font-semibold">
                {w.note}
              </span>
            )}
          </button>
        );
      })}
      {onAddWeek && (
        <button
          type="button"
          onClick={onAddWeek}
          disabled={addDisabled}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-shrink-0 min-w-[60px] px-2.5 py-2 rounded-sm transition-colors",
            "border border-dashed border-border bg-card/50 hover:bg-bg-tinted hover:border-foreground/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Ajouter une semaine"
          title="Ajouter une semaine"
        >
          <Plus className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
          <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted-subtle">
            Semaine
          </span>
        </button>
      )}
    </div>
  );
};

export default ProgWeekSelector;