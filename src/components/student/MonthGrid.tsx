import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatLocalDate } from "@/lib/date-utils";

export interface MonthDayMarkers {
  /** A programmed session is scheduled (program or free session) */
  hasSession?: boolean;
  /** The session has been completed */
  isCompleted?: boolean;
  /** Has at least one external/logged activity */
  hasExternal?: boolean;
  /** Optional program week number to show as small footer text (e.g. "S3") */
  weekTag?: string;
}

interface MonthGridProps {
  /** Any date inside the displayed month (typically the first day) */
  monthAnchor: Date;
  /** Currently selected date — its cell gets highlighted */
  selectedDate: Date;
  /** Per-day markers keyed by YYYY-MM-DD (local) */
  markers: Map<string, MonthDayMarkers>;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToday?: () => void;
}

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Sage — monthly calendar grid (7×N).
 * Mirrors the iOS-style minimal calendar: day numbers, today ring,
 * selected pill, and small dots under each day to hint at session activity.
 * Reuses existing tokens — no new visual style introduced.
 */
const MonthGrid = ({
  monthAnchor,
  selectedDate,
  markers,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onJumpToday,
}: MonthGridProps) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const cells = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    // Monday-aligned offset (0=Mon..6=Sun)
    const dow = firstOfMonth.getDay();
    const leading = (dow + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - leading);

    // 6 rows × 7 cols = 42 cells, always.
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [monthAnchor]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("fr", { month: "long", year: "numeric" }).format(
        monthAnchor
      ),
    [monthAnchor]
  );

  const selectedKey = formatLocalDate(selectedDate);
  const todayKey = formatLocalDate(today);
  const currentMonth = monthAnchor.getMonth();
  const isViewingCurrentMonth =
    today.getFullYear() === monthAnchor.getFullYear() &&
    today.getMonth() === currentMonth;

  return (
    <div className="border-b border-border">
      {/* Header: month label + nav */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onPrevMonth}
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </Button>
        <button
          type="button"
          onClick={onJumpToday}
          disabled={!onJumpToday || isViewingCurrentMonth}
          className={cn(
            "text-[13px] font-bold capitalize tracking-tight rounded-sm px-2 py-1 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            onJumpToday && !isViewingCurrentMonth
              ? "text-foreground hover:bg-bg-tinted cursor-pointer"
              : "text-foreground cursor-default"
          )}
          aria-label={isViewingCurrentMonth ? monthLabel : `${monthLabel} — revenir à aujourd'hui`}
        >
          {monthLabel}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onNextMonth}
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2 pb-1">
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-bold uppercase tracking-[0.08em] text-muted-subtle"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
        {cells.map((d, i) => {
          const key = formatLocalDate(d);
          const inMonth = d.getMonth() === currentMonth;
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const m = markers.get(key);
          const hasSession = !!m?.hasSession;
          const isCompleted = !!m?.isCompleted;
          const hasExternal = !!m?.hasExternal;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(d)}
              className={cn(
                "relative h-11 flex flex-col items-center justify-center rounded-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                "transition-colors",
                !inMonth && "opacity-30",
                isSelected
                  ? "bg-primary/10"
                  : "hover:bg-bg-tinted active:bg-bg-tinted"
              )}
              aria-label={d.toLocaleDateString("fr", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              aria-pressed={isSelected}
            >
              <span
                className={cn(
                  "text-[13px] tabular-nums leading-none",
                  isToday
                    ? "text-primary font-bold"
                    : isSelected
                      ? "text-primary font-bold"
                      : hasSession
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground font-medium"
                )}
              >
                {d.getDate()}
              </span>
              {/* Marker row */}
              <div className="mt-1 flex items-center gap-0.5 h-1">
                {hasSession && (
                  <span
                    className={cn(
                      "w-1 h-1 rounded-full",
                      isCompleted ? "bg-success" : "bg-primary"
                    )}
                  />
                )}
                {hasExternal && (
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                )}
              </div>
              {/* Today ring (subtle) */}
              {isToday && !isSelected && (
                <span
                  aria-hidden
                  className="absolute inset-1 rounded-sm border border-primary/40 pointer-events-none"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthGrid;
