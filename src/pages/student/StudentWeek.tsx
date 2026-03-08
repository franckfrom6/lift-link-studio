import { Calendar, ChevronLeft, ChevronRight, Dumbbell, Play, CheckCircle, Clock, Target, ArrowLeftRight, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import SessionSwapModal from "@/components/student/SessionSwapModal";
import SwapBadge from "@/components/student/SwapBadge";
import { useSessionSwaps } from "@/hooks/useSessionSwaps";
import { useStudentProgram, DBSession } from "@/hooks/useStudentProgram";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const StudentWeek = () => {
  const { user } = useAuth();
  const { program, loading, seedDemo } = useStudentProgram();
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();
  const [swapMode, setSwapMode] = useState(false);
  const [swapSourceDay, setSwapSourceDay] = useState<number | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetDay, setSwapTargetDay] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);

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

  // Build sessions map from DB program (week 1, map day_of_week to 0-indexed)
  const dbSessions = useMemo(() => {
    const map: Record<number, { name: string; sessionId: string; session: DBSession }> = {};
    if (!program || !program.weeks[0]) return map;
    for (const session of program.weeks[0].sessions) {
      const idx = session.day_of_week - 1; // day_of_week is 1-indexed
      map[idx] = { name: session.name, sessionId: session.id, session };
    }
    return map;
  }, [program]);

  // Apply swaps
  const effectiveSessions = useMemo(() => {
    const sessions = { ...dbSessions };
    for (const swap of swaps) {
      const origIdx = swap.original_day - 1;
      const newIdx = swap.new_day - 1;
      if (sessions[origIdx]) {
        sessions[newIdx] = sessions[origIdx];
        delete sessions[origIdx];
      }
    }
    return sessions;
  }, [dbSessions, swaps]);

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

  const totalExercises = useMemo(() => {
    if (!program || !program.weeks[0]) return 0;
    return program.weeks[0].sessions.reduce((acc, s) =>
      acc + s.sections.reduce((a, sec) => a + sec.exercises.length, 0), 0);
  }, [program]);

  const handleDayClickInSwapMode = (dayIndex: number) => {
    if (swapSourceDay === null) return;
    if (dayIndex === swapSourceDay) {
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

  const handleSeedDemo = async () => {
    setSeeding(true);
    await seedDemo();
    setSeeding(false);
    toast.success("Programme démo chargé !");
  };

  const targetHasSession = swapTargetDay !== null && !!effectiveSessions[swapTargetDay];
  const sourceDayHasSession = swapSourceDay !== null && !!effectiveSessions[swapSourceDay];

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <p className="text-muted-foreground">Connectez-vous pour voir votre programme</p>
        <Button onClick={() => navigate("/auth")}>Se connecter</Button>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // No program — offer seed
  if (!program) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4 animate-fade-in">
        <Dumbbell className="w-12 h-12 text-muted-foreground/40 mx-auto" strokeWidth={1.5} />
        <h2 className="text-xl font-bold">Aucun programme actif</h2>
        <p className="text-muted-foreground text-sm">Votre coach ne vous a pas encore assigné de programme.</p>
        <Button onClick={handleSeedDemo} disabled={seeding}>
          {seeding ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Chargement...</>
          ) : (
            "Charger le programme démo"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Salut 💪</h1>
        <p className="text-muted-foreground text-sm mt-1">Votre programme de la semaine</p>
      </div>

      {/* Current program card */}
      <div className="glass p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-sm">{program.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Semaine 1</p>
          </div>
          <Badge>Actif</Badge>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Dumbbell className="w-3 h-3" strokeWidth={1.5} />
            {totalExercises} exercices
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="w-3 h-3" strokeWidth={1.5} />
            {Object.keys(dbSessions).length}x/semaine
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
            variant="ghost" size="icon"
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
          const sessionData = effectiveSessions[day.dayIndex];

          return (
            <button
              key={day.name}
              onClick={() => {
                if (swapMode) {
                  handleDayClickInSwapMode(day.dayIndex);
                } else if (isSessionDay && weekOffset === 0 && sessionData) {
                  navigate(`/student/session?sessionId=${sessionData.sessionId}`);
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
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                    day.isToday ? "bg-primary text-primary-foreground"
                      : isSessionDay ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {day.date.getDate()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm">{day.name}</p>
                      {swapInfo && (
                        <SwapBadge originalDay={swapInfo.originalDay} newDay={day.dayIndex + 1} reason={swapInfo.reason} />
                      )}
                    </div>
                    {isSessionDay && sessionData ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">{sessionData.name}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {sessionData.session.sections.length} blocs · {sessionData.session.sections.reduce((a, s) => a + s.exercises.length, 0)} exos
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {isDropTarget && sourceDayHasSession ? "Déplacer ici" : "Repos"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSessionDay && !swapMode && weekOffset === 0 && !day.isPast && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); setSwapMode(true); setSwapSourceDay(day.dayIndex); }}
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
          onClose={() => { setSwapModalOpen(false); setSwapMode(false); setSwapSourceDay(null); setSwapTargetDay(null); }}
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
