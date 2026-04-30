import { Check, ChevronRight, MessageCircle, MoreVertical, Bot } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DayState = "done" | "today" | "planned" | "past" | "rest";

const DAY_LABELS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface ProgDayLabelProps {
  dayShort: string;
  dayNum: number;
  state: DayState;
}

const ProgDayLabel = ({ dayShort, dayNum, state }: ProgDayLabelProps) => {
  const isToday = state === "today";
  const isDone = state === "done";
  const isRest = state === "rest";
  const isPast = state === "past";
  return (
    <div className="w-9 flex-shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
      <span
        className={cn(
          "text-[9px] font-bold uppercase tracking-[0.06em]",
          isToday ? "text-primary" : isRest ? "text-muted-subtle" : "text-muted-foreground"
        )}
      >
        {dayShort}
      </span>
      <span
        className={cn(
          "text-[17px] font-bold tabular-nums tracking-tight leading-none",
          isToday && "text-primary",
          isDone && "text-muted-foreground opacity-70",
          isRest && "text-muted-subtle",
          isPast && "text-muted-foreground",
          !isToday && !isDone && !isRest && !isPast && "text-foreground"
        )}
      >
        {dayNum}
      </span>
    </div>
  );
};

export interface ProgDayRowProps {
  dayIndex: number;          // 0..6 (Mon..Sun)
  date: Date;
  state: DayState;
  isLast?: boolean;

  // Session info (null if rest day)
  sessionName?: string | null;
  sessionMeta?: string | null;     // e.g. "~62 min · 6 exos" or "64 min · terminée 18h42"
  hasCoachNote?: boolean;
  isAI?: boolean;

  onClick?: () => void;
  actionMenu?: ReactNode;          // dropdown content for the "..." menu

  /** Optional secondary children (extra free sessions, external activities) rendered below the main row */
  children?: ReactNode;
}

/**
 * Sage Phase 4 — single chronological day row.
 * Today: subtle primary tint + 3px accent stripe on the left.
 * Done: muted text + check pill on the right.
 * Rest: lightweight placeholder line.
 */
const ProgDayRow = ({
  dayIndex,
  date,
  state,
  isLast,
  sessionName,
  sessionMeta,
  hasCoachNote,
  isAI,
  onClick,
  actionMenu,
  children,
}: ProgDayRowProps) => {
  const dayShort = DAY_LABELS_FR[dayIndex] ?? "";
  const dayNum = date.getDate();
  const isRest = state === "rest";
  const isToday = state === "today";
  const isDone = state === "done";

  // Rest row — minimal placeholder
  if (isRest) {
    return (
      <div
        className={cn(
          "flex items-center gap-3.5 px-4 py-2.5 min-h-[44px]",
          !isLast && "border-b border-border"
        )}
      >
        <ProgDayLabel dayShort={dayShort} dayNum={dayNum} state="rest" />
        <div className="flex-1 text-[13px] font-medium text-muted-subtle">Repos</div>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative",
        !isLast && "border-b border-border",
        isToday && "bg-primary/5"
      )}
    >
      {isToday && (
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary"
        />
      )}

      <div className="flex items-stretch gap-3.5 px-4 py-3 min-h-[56px]">
        <ProgDayLabel dayShort={dayShort} dayNum={dayNum} state={state} />

        <button
          type="button"
          onClick={onClick}
          disabled={!onClick}
          className={cn(
            "flex-1 min-w-0 flex flex-col gap-1.5 text-left",
            onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          )}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[14px] font-bold tracking-tight truncate",
                isToday && "text-primary",
                isDone && "text-muted-foreground",
                !isToday && !isDone && "text-foreground"
              )}
            >
              {sessionName}
            </span>
            {isToday && (
              <span className="px-1.5 py-[1px] rounded-xs bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-[0.04em]">
                Aujourd'hui
              </span>
            )}
            {isAI && (
              <span className="inline-flex items-center gap-0.5 bg-bg-tinted text-muted-foreground text-[9px] font-bold uppercase tracking-[0.04em] px-1.5 py-[1px] rounded-xs">
                <Bot className="w-2.5 h-2.5" strokeWidth={2} />
                IA
              </span>
            )}
            {hasCoachNote && (
              <MessageCircle
                className={cn(
                  "w-3 h-3 opacity-70",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={2}
              />
            )}
          </div>

          {sessionMeta && (
            <div
              className={cn(
                "flex items-center gap-2 text-[12px] tabular-nums",
                isToday ? "text-primary/80" : "text-muted-foreground",
                isDone && "opacity-70"
              )}
            >
              <span className="font-medium">{sessionMeta}</span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          {actionMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Plus d'actions"
                >
                  <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {actionMenu}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isDone ? (
            <div className="w-6 h-6 rounded-full bg-success-bg text-success flex items-center justify-center">
              <Check className="w-3 h-3" strokeWidth={2.5} />
            </div>
          ) : (
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5",
                isToday ? "text-primary" : "text-muted-subtle"
              )}
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {children && <div className="px-4 pb-3 -mt-1 pl-[60px]">{children}</div>}
    </div>
  );
};

export default ProgDayRow;