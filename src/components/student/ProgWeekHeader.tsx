import { ReactNode } from "react";

interface ProgWeekHeaderProps {
  label: string;          // e.g. "Cette semaine"
  range: string;          // e.g. "lun. 13 — dim. 19 janv."
  completedSessions: number;
  totalSessions: number;
  /**
   * Optional override for the label line. When provided, replaces the default
   * text label/range pair (used to plug an interactive week picker).
   */
  labelSlot?: ReactNode;
}

/**
 * Sage Phase 4 — week summary block.
 * Big number / total + slim progress bar in the foreground color.
 */
const ProgWeekHeader = ({ label, range, completedSessions, totalSessions, labelSlot }: ProgWeekHeaderProps) => {
  const pct = totalSessions > 0 ? Math.min(100, (completedSessions / totalSessions) * 100) : 0;
  return (
    <div className="px-4 pt-4 pb-3 flex items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        {labelSlot ? (
          labelSlot
        ) : (
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate">
            {label} · {range}
          </p>
        )}
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-[28px] font-bold tabular-nums tracking-tight text-foreground leading-none">
            {completedSessions}
          </span>
          <span className="text-sm font-medium text-muted-subtle">/ {totalSessions} séances</span>
        </div>
      </div>
      <div className="flex-1 max-w-[120px] pb-1">
        <div className="h-1 bg-bg-tinted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgWeekHeader;