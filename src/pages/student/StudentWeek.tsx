import { Calendar, ChevronLeft, ChevronRight, Dumbbell, Play, CheckCircle, Clock, Target, ArrowLeftRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { YANA_PROGRAM } from "@/data/yana-program";
import { cn } from "@/lib/utils";
import SessionSwapModal from "@/components/student/SessionSwapModal";
import SwapBadge from "@/components/student/SwapBadge";
import { useSessionSwaps } from "@/hooks/useSessionSwaps";
import { toast } from "sonner";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Sessions mapped by day index (0-indexed). Currently only Wednesday.
const DEFAULT_SESSIONS: Record<number, { name: string; sessionId: string }> = {
  3: { name: "Lower Body — Glutes", sessionId: "demo-session-1" },
};

const StudentWeek = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();
  const [swapMode, setSwapMode] = useState(false);
  const [swapSourceDay, setSwapSourceDay] = useState<number | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetDay, setSwapTargetDay] = useState<number | null>(null);

  const getWeekStart = () => {
    const now = new Date();
    const start = new Date(now);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const weekStart = useMemo(getWeekStart, [weekOffset]);
  const { swaps, createSwap } = useSessionSwaps(weekStart);

  // Build effective sessions map accounting for swaps
  const effectiveSessions = useMemo(() => {
    const sessions = { ...DEFAULT_SESSIONS };
    // Apply swaps: move sessions from original_day to new_day
    for (const swap of swaps) {
      const origIdx = swap.original_day - 1; // 1-indexed to 0-indexed
      const newIdx = swap.new_day - 1;
      if (sessions[origIdx]) {
        sessions[newIdx] = sessions[origIdx];
        delete sessions[origIdx];
      }
    }
    return sessions;
  }, [swaps]);

  // Track which days were swapped (for showing badges)
  const swappedDays = useMemo(() => {
    const map: Record<number, { originalDay: number; reason: string | null }> = {};
    for (const swap of swaps) {
      map[swap.new_day - 1] = { originalDay: swap.original_day, reason: swap.reason };
    }
    return map;
  }, [swaps]);

  const getWeekDates = () => {
    return DAYS.map((name, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const isToday = date.toDateString() === new Date().toDateString();
      const hasSession = !!effectiveSessions[i];
      const isPast = date < new Date() && !isToday;
      return { name, date, isToday, hasSession, isPast, dayIndex: i };
    });
  };

  const dates = getWeekDates();
  const totalExercises = YANA_PROGRAM.sections.reduce((a, s) => a + s.exercises.length, 0);

  const handleDayClickInSwapMode = (dayIndex: number) => {
    if (swapSourceDay === null) return;
    if (dayIndex === swapSourceDay) {
      // cancel
      setSwapMode(false);
      setSwapSourceDay(null);
      return;
    }
    setSwapTargetDay(dayIndex);
    setSwapModalOpen(true);
  };

  const handleSwapConfirm = async (reason: string) => {
    if (swapSourceDay === null || swapTargetDay === null) return;
    const sourceDate = dates[swapSourceDay].date;
    const targetDate = dates[swapTargetDay].date;
    const session = effectiveSessions[swapSourceDay];
    if (!session) return;

    const result = await createSwap({
      sessionId: session.sessionId,
      originalDay: swapSourceDay + 1,
      newDay: swapTargetDay + 1,
      originalDate: sourceDate,
      newDate: targetDate,
      reason,
    });

    if (result) {
      toast.success("Séance déplacée !");
    } else {
      toast.error("Erreur lors du déplacement");
    }
    setSwapMode(false);
    setSwapSourceDay(null);
    setSwapTargetDay(null);
    setSwapModalOpen(false);
  };

  const sourceDayHasSession = swapSourceDay !== null && !!effectiveSessions[swapSourceDay];
  const targetHasSession = swapTargetDay !== null && !!effectiveSessions[swapTargetDay];

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Salut, Yana 💪</h1>
        <p className="text-muted-foreground text-sm mt-1">Votre programme de la semaine</p>
      </div>

      {/* Current program card */}
      <div className="glass p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-sm">{YANA_PROGRAM.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{YANA_PROGRAM.objective}</p>
          </div>
          <Badge>Actif</Badge>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            {YANA_PROGRAM.duration}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Dumbbell className="w-3 h-3" strokeWidth={1.5} />
            {totalExercises} exercices
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="w-3 h-3" strokeWidth={1.5} />
            1x/semaine
          </div>
        </div>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}>
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <span className="text-sm font-medium">
          {weekOffset === 0 ? "Cette semaine" : weekOffset === -1 ? "Semaine dernière" : weekOffset === 1 ? "Semaine prochaine" : `Semaine ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}>
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Swap mode banner */}
      {swapMode && (
        <div className="flex items-center justify-between bg-warning-bg text-warning rounded-lg px-4 py-2.5 text-sm font-medium animate-fade-in">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" strokeWidth={1.5} />
            Choisissez le jour cible
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-warning hover:text-warning"
            onClick={() => { setSwapMode(false); setSwapSourceDay(null); }}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      )}

      {/* Days */}
      <div className="space-y-2">
        {dates.map((day) => {
          const isSessionDay = day.hasSession;
          const sessionCompleted = isSessionDay && day.isPast && weekOffset < 0;
          const swapInfo = swappedDays[day.dayIndex];
          const isSwapSource = swapMode && day.dayIndex === swapSourceDay;
          const isDropTarget = swapMode && day.dayIndex !== swapSourceDay;

          return (
            <button
              key={day.name}
              onClick={() => {
                if (swapMode) {
                  handleDayClickInSwapMode(day.dayIndex);
                } else if (isSessionDay && weekOffset === 0) {
                  navigate("/student/session");
                }
              }}
              disabled={!swapMode && !isSessionDay}
              className={cn(
                "w-full glass p-4 transition-all text-left",
                day.isToday && "ring-1 ring-primary/40",
                isSessionDay && !swapMode && "hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] cursor-pointer",
                !isSessionDay && !swapMode && "opacity-50 cursor-default",
                isSwapSource && "ring-2 ring-warning bg-warning-bg",
                isDropTarget && "ring-1 ring-dashed ring-warning/50 cursor-pointer hover:ring-warning hover:bg-warning-bg/50",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                      day.isToday
                        ? "bg-primary text-primary-foreground"
                        : isSessionDay
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {day.date.getDate()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm">{day.name}</p>
                      {swapInfo && (
                        <SwapBadge
                          originalDay={swapInfo.originalDay}
                          newDay={day.dayIndex + 1}
                          reason={swapInfo.reason}
                        />
                      )}
                    </div>
                    {isSessionDay ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          {effectiveSessions[day.dayIndex]?.name || "Séance"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{YANA_PROGRAM.duration}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">Fessiers, Ischios</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {isDropTarget && sourceDayHasSession ? "Déplacer ici" : "Repos"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Swap button on session days (not in swap mode) */}
                  {isSessionDay && !swapMode && weekOffset === 0 && !day.isPast && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSwapMode(true);
                        setSwapSourceDay(day.dayIndex);
                      }}
                    >
                      <ArrowLeftRight className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  )}
                  {isSessionDay && weekOffset === 0 && !day.isPast && !swapMode ? (
                    <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg">
                      <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="text-xs font-semibold">Go</span>
                    </div>
                  ) : isSessionDay && sessionCompleted ? (
                    <CheckCircle className="w-5 h-5 text-success" strokeWidth={1.5} />
                  ) : !isSessionDay && !swapMode ? (
                    <Calendar className="w-4 h-4 text-muted-foreground/30" strokeWidth={1.5} />
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Swap confirmation modal */}
      {swapSourceDay !== null && swapTargetDay !== null && (
        <SessionSwapModal
          open={swapModalOpen}
          onClose={() => {
            setSwapModalOpen(false);
            setSwapMode(false);
            setSwapSourceDay(null);
            setSwapTargetDay(null);
          }}
          onConfirm={handleSwapConfirm}
          sessionName={effectiveSessions[swapSourceDay]?.name || "Séance"}
          fromDayIndex={swapSourceDay}
          toDayIndex={swapTargetDay}
          fromDate={dates[swapSourceDay].date}
          toDate={dates[swapTargetDay].date}
          isMutualSwap={targetHasSession}
          targetSessionName={targetHasSession ? effectiveSessions[swapTargetDay]?.name : undefined}
        />
      )}
    </div>
  );
};

export default StudentWeek;
