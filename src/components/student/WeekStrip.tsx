import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatLocalDate } from "@/lib/date-utils";
import type { MonthDayMarkers } from "./MonthGrid";

interface WeekStripProps {
  monthAnchor: Date;
  selectedDate: Date;
  markers: Map<string, MonthDayMarkers>;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToday?: () => void;
}

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const startOfISOWeek = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = (dow + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
};

const WeekStrip = ({
  selectedDate,
  markers,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: WeekStripProps) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekStart = useMemo(() => startOfISOWeek(selectedDate), [selectedDate]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [weekStart]);

  const rangeLabel = useMemo(() => {
    const start = days[0];
    const end = days[6];
    const sameMonth = start.getMonth() === end.getMonth();
    const dayFmt = new Intl.DateTimeFormat("fr", { day: "numeric" });
    const monthFmt = new Intl.DateTimeFormat("fr", { month: "short" });
    const yearFmt = new Intl.DateTimeFormat("fr", { year: "numeric" });
    if (sameMonth) {
      return `${dayFmt.format(start)} – ${dayFmt.format(end)} ${monthFmt.format(end)} ${yearFmt.format(end)}`;
    }
    return `${dayFmt.format(start)} ${monthFmt.format(start)} – ${dayFmt.format(end)} ${monthFmt.format(end)} ${yearFmt.format(end)}`;
  }, [days]);

  const selectedKey = formatLocalDate(selectedDate);
  const todayKey = formatLocalDate(today);

  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onPrevMonth}
          aria-label="Semaine précédente"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </Button>
        <span className="text-[12px] font-bold capitalize tracking-tight text-foreground">
          {rangeLabel}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onNextMonth}
          aria-label="Semaine suivante"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-2 pb-2">
        {days.map((d, i) => {
          const key = formatLocalDate(d);
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
                "relative h-14 flex flex-col items-center justify-center rounded-full px-1 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "bg-primary/10"
                  : "hover:bg-bg-tinted active:bg-bg-tinted"
              )}
              aria-label={d.toLocaleDateString("fr", { weekday: "long", day: "numeric", month: "long" })}
              aria-pressed={isSelected}
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-subtle leading-none">
                {DAY_LABELS[i]}
              </span>
              <span
                className={cn(
                  "mt-1 text-[14px] tabular-nums leading-none",
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
              <div className="mt-1 flex items-center gap-0.5 h-1">
                {hasSession && (
                  <span className={cn("w-1 h-1 rounded-full", isCompleted ? "bg-success" : "bg-primary")} />
                )}
                {hasExternal && <span className="w-1 h-1 rounded-full bg-muted-foreground" />}
              </div>
              {isToday && !isSelected && (
                <span aria-hidden className="absolute inset-1 rounded-full border border-primary/40 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekStrip;
