import { Calendar, ChevronLeft, ChevronRight, Dumbbell, Play, CheckCircle, Clock, Target, ArrowLeftRight, X, Plus, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { YANA_PROGRAM } from "@/data/yana-program";
import { cn } from "@/lib/utils";
import SessionSwapModal from "@/components/student/SessionSwapModal";
import SwapBadge from "@/components/student/SwapBadge";
import ExternalSessionForm, { ExternalSessionData } from "@/components/student/ExternalSessionForm";
import ExternalSessionCard from "@/components/student/ExternalSessionCard";
import WeeklyCheckinForm, { CheckinData } from "@/components/student/WeeklyCheckinForm";
import CheckinBadge from "@/components/student/CheckinBadge";
import WeeklyLoadBar from "@/components/student/WeeklyLoadBar";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const DEFAULT_SESSIONS: Record<number, { name: string; sessionId: string }> = {
  3: { name: "Lower Body — Glutes", sessionId: "demo-session-1" },
};

interface LocalSwap {
  id: string;
  originalDay: number;
  newDay: number;
  reason: string | null;
}

const StudentWeek = () => {
  const { t } = useTranslation(['calendar', 'common', 'session']);
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();
  const [swapMode, setSwapMode] = useState(false);
  const [swapSourceDay, setSwapSourceDay] = useState<number | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetDay, setSwapTargetDay] = useState<number | null>(null);
  const [localSwaps, setLocalSwaps] = useState<LocalSwap[]>([]);

  // External sessions (local state for now)
  const [externalSessions, setExternalSessions] = useState<ExternalSessionData[]>([]);
  const [externalFormOpen, setExternalFormOpen] = useState(false);
  const [externalFormDate, setExternalFormDate] = useState<Date>(new Date());
  const [editingExternal, setEditingExternal] = useState<ExternalSessionData | null>(null);

  // Weekly check-in (local state)
  const [checkins, setCheckins] = useState<Record<string, CheckinData>>({});
  const [checkinFormOpen, setCheckinFormOpen] = useState(false);

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
  const weekKey = weekStart.toISOString().split("T")[0];
  const currentCheckin = checkins[weekKey] || null;

  const effectiveSessions = useMemo(() => {
    const sessions = { ...DEFAULT_SESSIONS };
    for (const swap of localSwaps) {
      if (sessions[swap.originalDay]) {
        sessions[swap.newDay] = sessions[swap.originalDay];
        delete sessions[swap.originalDay];
      }
    }
    return sessions;
  }, [localSwaps]);

  const swappedDays = useMemo(() => {
    const map: Record<number, { originalDay: number; reason: string | null }> = {};
    for (const swap of localSwaps) {
      map[swap.newDay] = { originalDay: swap.originalDay + 1, reason: swap.reason };
    }
    return map;
  }, [localSwaps]);

  const getExternalForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return externalSessions.filter(s => s.date === dateStr);
  };

  const weekExternals = useMemo(() => {
    return externalSessions.filter(s => {
      const d = new Date(s.date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return d >= weekStart && d < weekEnd;
    });
  }, [externalSessions, weekStart]);

  const programmedCount = Object.keys(effectiveSessions).length;

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
      setSwapMode(false);
      setSwapSourceDay(null);
      return;
    }
    setSwapTargetDay(dayIndex);
    setSwapModalOpen(true);
  };

  const handleSwapConfirm = (reason: string) => {
    if (swapSourceDay === null || swapTargetDay === null) return;
    setLocalSwaps(prev => [
      ...prev,
      { id: crypto.randomUUID(), originalDay: swapSourceDay, newDay: swapTargetDay, reason: reason || null },
    ]);
    toast.success(t('session:session_moved'));
    setSwapMode(false);
    setSwapSourceDay(null);
    setSwapTargetDay(null);
    setSwapModalOpen(false);
  };

  const handleAddExternal = (date: Date) => {
    setExternalFormDate(date);
    setEditingExternal(null);
    setExternalFormOpen(true);
  };

  const handleExternalSubmit = (data: ExternalSessionData) => {
    if (data.id) {
      setExternalSessions(prev => prev.map(s => s.id === data.id ? data : s));
      toast.success(t('calendar:activity_modified'));
    } else {
      setExternalSessions(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
      toast.success(t('calendar:activity_added'));
    }
  };

  const handleDeleteExternal = (id: string) => {
    setExternalSessions(prev => prev.filter(s => s.id !== id));
    toast.success(t('calendar:activity_deleted'));
  };

  const handleCheckinSubmit = (data: CheckinData) => {
    setCheckins(prev => ({ ...prev, [weekKey]: data }));
    toast.success(t('checkin:checkin_sent'));
  };

  const targetHasSession = swapTargetDay !== null && !!effectiveSessions[swapTargetDay];
  const sourceDayHasSession = swapSourceDay !== null && !!effectiveSessions[swapSourceDay];

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
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

      {/* Week navigator + Nutrition shortcut */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}>
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {weekOffset === 0 ? "Cette semaine" : weekOffset === -1 ? "Semaine dernière" : weekOffset === 1 ? "Semaine prochaine" : `Semaine ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
          </span>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate("/student/nutrition")}>
            <Utensils className="w-3 h-3" strokeWidth={1.5} />
            Nutrition
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}>
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Weekly check-in badge */}
      {weekOffset === 0 && (
        <CheckinBadge
          checkin={currentCheckin}
          onClick={() => setCheckinFormOpen(true)}
        />
      )}

      {/* Weekly load bar */}
      {(programmedCount > 0 || weekExternals.length > 0) && (
        <WeeklyLoadBar
          programmedSessions={programmedCount}
          externalSessions={weekExternals}
        />
      )}

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
          const dayExternals = getExternalForDay(day.date);

          return (
            <div key={day.name} className="space-y-1">
              <div
                role={isSessionDay || swapMode ? "button" : undefined}
                tabIndex={isSessionDay || swapMode ? 0 : undefined}
                onClick={() => {
                  if (swapMode) {
                    handleDayClickInSwapMode(day.dayIndex);
                  } else if (isSessionDay && weekOffset === 0) {
                    navigate("/student/session");
                  }
                }}
                className={cn(
                  "w-full glass p-4 transition-all text-left",
                  day.isToday && "ring-1 ring-primary/40",
                  isSessionDay && !swapMode && "hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] cursor-pointer",
                  !isSessionDay && dayExternals.length === 0 && !swapMode && "opacity-50",
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
                      {isSessionDay ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground">Lower Body — Glutes</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{YANA_PROGRAM.duration}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">Fessiers, Ischios</span>
                          </div>
                        </div>
                      ) : dayExternals.length > 0 ? (
                        <div className="space-y-0.5">
                          {dayExternals.map(ext => (
                            <ExternalSessionCard key={ext.id} session={ext} compact />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {isDropTarget && sourceDayHasSession ? "Déplacer ici" : "Repos"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSessionDay && !swapMode && weekOffset === 0 && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); setSwapMode(true); setSwapSourceDay(day.dayIndex); }}
                      >
                        <ArrowLeftRight className="w-4 h-4" strokeWidth={1.5} />
                      </Button>
                    )}
                    {!swapMode && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); handleAddExternal(day.date); }}
                      >
                        <Plus className="w-4 h-4" strokeWidth={1.5} />
                      </Button>
                    )}
                    {isSessionDay && weekOffset === 0 && !day.isPast && !swapMode ? (
                      <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg">
                        <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span className="text-xs font-semibold">Go</span>
                      </div>
                    ) : isSessionDay && sessionCompleted ? (
                      <CheckCircle className="w-5 h-5 text-success" strokeWidth={1.5} />
                    ) : null}
                  </div>
                </div>

                {/* External sessions under the main row */}
                {isSessionDay && dayExternals.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border space-y-1">
                    {dayExternals.map(ext => (
                      <ExternalSessionCard key={ext.id} session={ext} compact />
                    ))}
                  </div>
                )}
              </div>

              {/* Editable external sessions list (expanded view for days with externals only, non-session days) */}
              {!isSessionDay && dayExternals.length > 0 && (
                <div className="pl-14 space-y-1">
                  {dayExternals.map(ext => (
                    <ExternalSessionCard
                      key={ext.id}
                      session={ext}
                      onEdit={() => { setEditingExternal(ext); setExternalFormDate(day.date); setExternalFormOpen(true); }}
                      onDelete={() => handleDeleteExternal(ext.id!)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Swap confirmation modal */}
      {swapSourceDay !== null && swapTargetDay !== null && (
        <SessionSwapModal
          open={swapModalOpen}
          onClose={() => { setSwapModalOpen(false); setSwapMode(false); setSwapSourceDay(null); setSwapTargetDay(null); }}
          onConfirm={handleSwapConfirm}
          sessionName="Lower Body — Glutes"
          fromDayIndex={swapSourceDay}
          toDayIndex={swapTargetDay}
          fromDate={dates[swapSourceDay].date}
          toDate={dates[swapTargetDay].date}
          isMutualSwap={targetHasSession}
          targetSessionName={targetHasSession ? effectiveSessions[swapTargetDay]?.name : undefined}
        />
      )}

      {/* External session form */}
      <ExternalSessionForm
        open={externalFormOpen}
        onClose={() => { setExternalFormOpen(false); setEditingExternal(null); }}
        onSubmit={handleExternalSubmit}
        date={externalFormDate}
        initialData={editingExternal}
      />

      {/* Weekly check-in form */}
      <WeeklyCheckinForm
        open={checkinFormOpen}
        onClose={() => setCheckinFormOpen(false)}
        onSubmit={handleCheckinSubmit}
        weekStart={weekStart}
        initialData={currentCheckin}
      />
    </div>
  );
};

export default StudentWeek;
