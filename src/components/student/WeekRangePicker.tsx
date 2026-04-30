import { useState } from "react";
import { ChevronDown, CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface WeekRangePickerProps {
  /** Monday of the displayed week */
  weekStart: Date;
  /** Localized label like "Cette semaine" */
  label: string;
  /** Localized range like "lun. 13 — dim. 19 janv." */
  range: string;
  /** Called with the selected date — caller should snap to its Monday */
  onSelectDate: (date: Date) => void;
  /** Optional: called when the user clicks the "Today" shortcut */
  onJumpToday?: () => void;
  /** True when the displayed week is the actual current week */
  isCurrentWeek?: boolean;
}

/**
 * Sage — week label that opens a monthly mini-calendar to jump to any week.
 * The whole pill (label + range + chevron) is the trigger.
 */
const WeekRangePicker = ({
  weekStart,
  label,
  range,
  onSelectDate,
  onJumpToday,
  isCurrentWeek,
}: WeekRangePickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex items-center gap-1.5 -ml-1 px-1 py-0.5 rounded-sm",
            "text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
            "hover:text-foreground transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label="Choisir une semaine"
        >
          <CalendarDays
            className="w-3 h-3 text-muted-subtle group-hover:text-foreground transition-colors"
            strokeWidth={2}
          />
          <span className="truncate">{label} · {range}</span>
          <ChevronDown
            className={cn(
              "w-3 h-3 text-muted-subtle transition-transform",
              open && "rotate-180"
            )}
            strokeWidth={2}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={weekStart}
          onSelect={(date) => {
            if (date) {
              onSelectDate(date);
              setOpen(false);
            }
          }}
          weekStartsOn={1}
          showOutsideDays
          initialFocus
          className="p-3 pointer-events-auto"
        />
        {!isCurrentWeek && onJumpToday && (
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => {
                onJumpToday();
                setOpen(false);
              }}
              className="w-full text-center text-xs font-semibold text-primary hover:bg-primary/10 py-1.5 rounded-sm transition-colors"
            >
              Revenir à aujourd'hui
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default WeekRangePicker;