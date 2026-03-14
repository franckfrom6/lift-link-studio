import { useRef, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayInfo {
  dayName: string;
  dayNumber: number;
  sessionName: string | null;
  isToday: boolean;
  isCompleted: boolean;
  hasSession: boolean;
}

interface DayTimelineProps {
  days: DayInfo[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const DayTimeline = ({ days, selectedIndex, onSelect }: DayTimelineProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-1 snap-x"
    >
      {days.map((day, i) => {
        const isSelected = i === selectedIndex;
        return (
          <button
            key={i}
            ref={day.isToday ? todayRef : undefined}
            onClick={() => onSelect(i)}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[56px] px-2 py-2.5 rounded-xl transition-all snap-center shrink-0",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : day.isToday
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary",
              !day.hasSession && !day.isToday && "opacity-50"
            )}
          >
            <span className="text-[10px] font-medium uppercase">{day.dayName}</span>
            <span className={cn("text-lg font-bold leading-none", isSelected && "text-primary-foreground")}>
              {day.dayNumber}
            </span>
            {day.isCompleted ? (
              <CheckCircle className="w-3.5 h-3.5 text-success" strokeWidth={2} />
            ) : day.hasSession ? (
              <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground/70" : "bg-primary/60")} />
            ) : (
              <div className="h-3.5" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default DayTimeline;
