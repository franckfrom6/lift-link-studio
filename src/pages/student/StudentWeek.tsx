import { Calendar, ChevronLeft, ChevronRight, Dumbbell, Play, CheckCircle, Clock, Target, ArrowLeftRight, X, Plus, Utensils, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import SessionSwapModal from "@/components/student/SessionSwapModal";
import SwapBadge from "@/components/student/SwapBadge";
import ExternalSessionForm, { ExternalSessionData } from "@/components/student/ExternalSessionForm";
import ExternalSessionCard from "@/components/student/ExternalSessionCard";
import WeeklyCheckinForm, { CheckinData } from "@/components/student/WeeklyCheckinForm";
import CheckinBadge from "@/components/student/CheckinBadge";
import WeeklyLoadBar from "@/components/student/WeeklyLoadBar";
import SelfGuidedDashboard from "@/components/student/SelfGuidedDashboard";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useStudentProgram } from "@/hooks/useStudentProgram";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionSwaps } from "@/hooks/useSessionSwaps";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { DraggableDayCard } from "@/components/student/DraggableDayCard";
import { supabase } from "@/integrations/supabase/client";

const StudentWeek = () => {
  const { t, i18n } = useTranslation(['calendar', 'common', 'session']);
  const { user } = useAuth();
  const { program, loading: programLoading, refreshing } = useStudentProgram();
  const DAYS = [
    t("common:days.mon"), t("common:days.tue"), t("common:days.wed"),
    t("common:days.thu"), t("common:days.fri"), t("common:days.sat"), t("common:days.sun"),
  ];
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();
  const [swapMode, setSwapMode] = useState(false);
  const [swapSourceDay, setSwapSourceDay] = useState<number | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetDay, setSwapTargetDay] = useState<number | null>(null);
  

  const [externalSessions, setExternalSessions] = useState<ExternalSessionData[]>([]);
  const [externalFormOpen, setExternalFormOpen] = useState(false);
  const [externalFormDate, setExternalFormDate] = useState<Date>(new Date());
  const [editingExternal, setEditingExternal] = useState<ExternalSessionData | null>(null);

  const [checkins, setCheckins] = useState<Record<string, CheckinData>>({});
  const [checkinFormOpen, setCheckinFormOpen] = useState(false);

  // Get selected week's sessions from DB program
  const totalWeeks = program?.weeks?.length || 0;

  // Compute which program week to display based on program start date and weekOffset
  const selectedWeekIndex = useMemo(() => {
    if (!program || totalWeeks === 0) return 0;
    // Monday of program creation week
    const created = new Date(program.created_at);
    const cDay = created.getDay();
    const cMonday = new Date(created);
    cMonday.setDate(cMonday.getDate() - cDay + (cDay === 0 ? -6 : 1));
    cMonday.setHours(0, 0, 0, 0);

    // Monday of currently displayed week
    const now = new Date();
    const nDay = now.getDay();
    const displayMonday = new Date(now);
    displayMonday.setDate(displayMonday.getDate() - nDay + (nDay === 0 ? -6 : 1) + weekOffset * 7);
    displayMonday.setHours(0, 0, 0, 0);

    const diffWeeks = Math.round((displayMonday.getTime() - cMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks < 0) return 0;
    return diffWeeks % totalWeeks;
  }, [program, totalWeeks, weekOffset]);

  const currentWeek = program?.weeks?.[selectedWeekIndex];
  const weekSessions = currentWeek?.sessions || [];

  // Build sessions map: day_of_week → session info
  // Map sessions by 0-based day index (0=Mon, 1=Tue, ..., 6=Sun)
  // day_of_week in DB is 1-based (1=Mon), so we subtract 1
  const DEFAULT_SESSIONS = useMemo(() => {
    const map: Record<number, { name: string; sessionId: string; exerciseCount: number; muscleGroups: string[] }> = {};
    for (const session of weekSessions) {
      const muscleGroups = session.sections
        .flatMap(s => s.exercises.map(e => e.exercise?.muscle_group))
        .filter(Boolean) as string[];
      const uniqueMuscles = [...new Set(muscleGroups)];
      const exerciseCount = session.sections.reduce((a, s) => a + s.exercises.length, 0);
      map[session.day_of_week - 1] = {
        name: session.name,
        sessionId: session.id,
        exerciseCount,
        muscleGroups: uniqueMuscles,
      };
    }
    return map;
  }, [weekSessions]);

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
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const { swaps: dbSwaps, createSwap } = useSessionSwaps(weekStart);
  const weekKey = weekStart.toISOString().split("T")[0];
  const currentCheckin = checkins[weekKey] || null;

  // Map DB swaps to the shape used by effectiveSessions
  const mappedSwaps = useMemo(() =>
    dbSwaps.map(s => ({ originalDay: s.original_day - 1, newDay: s.new_day - 1, reason: s.reason })),
    [dbSwaps]
  );

  const effectiveSessions = useMemo(() => {
    const sessions = { ...DEFAULT_SESSIONS };
    for (const swap of mappedSwaps) {
      if (sessions[swap.originalDay]) {
        sessions[swap.newDay] = sessions[swap.originalDay];
        delete sessions[swap.originalDay];
      }
    }
    return sessions;
  }, [mappedSwaps, DEFAULT_SESSIONS]);

  const swappedDays = useMemo(() => {
    const map: Record<number, { originalDay: number; reason: string | null }> = {};
    for (const swap of mappedSwaps) {
      map[swap.newDay] = { originalDay: swap.originalDay + 1, reason: swap.reason };
    }
    return map;
  }, [mappedSwaps]);

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
  const totalExercises = weekSessions.reduce(
    (a, s) => a + s.sections.reduce((b, sec) => b + sec.exercises.length, 0), 0
  );

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

  // DnD sensors with activation distance to avoid interfering with clicks
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const sourceDayIndex = active.data.current?.dayIndex as number;
    const targetDayIndex = over.data.current?.dayIndex as number;
    if (sourceDayIndex === undefined || targetDayIndex === undefined) return;
    if (sourceDayIndex === targetDayIndex) return;
    if (!effectiveSessions[sourceDayIndex]) return;
    setSwapSourceDay(sourceDayIndex);
    setSwapTargetDay(targetDayIndex);
    setSwapModalOpen(true);
  }, [effectiveSessions]);

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
    const sourceSession = effectiveSessions[swapSourceDay];
    if (!sourceSession) return;
    const dates = getWeekDates();
    const result = await createSwap({
      sessionId: sourceSession.sessionId,
      originalDay: swapSourceDay + 1,
      newDay: swapTargetDay + 1,
      originalDate: dates[swapSourceDay].date,
      newDate: dates[swapTargetDay].date,
      reason: reason || undefined,
    });
    if (result) {
      toast.success(t('session:session_moved'));
    }
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

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  if (programLoading) {
    return (
      <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto relative">
      {refreshing && (
        <div className="absolute top-0 right-0 z-10 flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full animate-pulse">
          <RefreshCw className="h-3 w-3 animate-spin" />
          {t('common:refreshing', 'Mise à jour…')}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold">{t('calendar:hello', { name: userName })}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('calendar:your_program')}</p>
      </div>

      {/* Current program card */}
      {program ? (
        <div className="glass p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-sm">{program.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {program.weeks.length} {t('common:weeks', 'semaines')}
              </p>
            </div>
            <Badge>{t('common:active')}</Badge>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Dumbbell className="w-3 h-3" strokeWidth={1.5} />
              {totalExercises} {t('calendar:exercises')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="w-3 h-3" strokeWidth={1.5} />
              {programmedCount}{t('calendar:per_week')}
            </div>
          </div>
        </div>
      ) : (
        <SelfGuidedDashboard
          onStartAI={() => {
            toast.info(t('calendar:ai_coming_soon', "La génération IA de programme arrive bientôt !"));
          }}
          onJoinCoach={(code) => {
            toast.info(t('calendar:join_coach_soon', "Fonctionnalité de rejoindre un coach à venir."));
          }}
        />
      )}





      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}>
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {weekOffset === 0 ? t('calendar:this_week') : weekOffset === -1 ? t('calendar:last_week') : weekOffset === 1 ? t('calendar:next_week') : t('calendar:week_offset', { offset: weekOffset })}
          </span>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate("/student/nutrition")}>
            <Utensils className="w-3 h-3" strokeWidth={1.5} />
            {t('calendar:nutrition')}
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
            {t('calendar:choose_target_day')}
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
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="space-y-2">
          {dates.map((day) => {
            const isSessionDay = day.hasSession;
            const sessionInfo = effectiveSessions[day.dayIndex];
            const sessionCompleted = isSessionDay && day.isPast && weekOffset < 0;
            const swapInfo = swappedDays[day.dayIndex];
            const isSwapSource = swapMode && day.dayIndex === swapSourceDay;
            const isDropTarget = swapMode && day.dayIndex !== swapSourceDay;
            const dayExternals = getExternalForDay(day.date);

            return (
              <div key={day.name} className="space-y-1">
                <DraggableDayCard
                  dayIndex={day.dayIndex}
                  hasSession={isSessionDay}
                  className={cn(
                    "w-full glass p-4 transition-all text-left touch-manipulation",
                    day.isToday && "ring-1 ring-primary/40",
                    isSessionDay && !swapMode && "hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] cursor-pointer",
                    !isSessionDay && dayExternals.length === 0 && !swapMode && "opacity-50",
                    isSwapSource && "ring-2 ring-warning bg-warning-bg",
                    isDropTarget && "ring-1 ring-dashed ring-warning/50 cursor-pointer hover:ring-warning hover:bg-warning-bg/50",
                  )}
                >
                  <div
                    onClick={() => {
                      if (swapMode) {
                        handleDayClickInSwapMode(day.dayIndex);
                      } else if (isSessionDay && sessionInfo) {
                        navigate("/student/session", { state: { sessionId: sessionInfo.sessionId } });
                      }
                    }}
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
                          {isSessionDay && sessionInfo ? (
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-foreground">{sessionInfo.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">{sessionInfo.exerciseCount} ex.</span>
                                {sessionInfo.muscleGroups.length > 0 && (
                                  <>
                                    <span className="text-[10px] text-muted-foreground">·</span>
                                    <span className="text-[10px] text-muted-foreground">{sessionInfo.muscleGroups.slice(0, 3).join(", ")}</span>
                                  </>
                                )}
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
                              {isDropTarget && sourceDayHasSession ? t('calendar:move_here') : t('common:rest')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSessionDay && !swapMode && (
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
                        {isSessionDay && !day.isPast && !swapMode ? (
                          <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg">
                            <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span className="text-xs font-semibold">Go</span>
                          </div>
                        ) : isSessionDay && sessionCompleted ? (
                          <CheckCircle className="w-5 h-5 text-success" strokeWidth={1.5} />
                        ) : null}
                      </div>
                    </div>

                    {isSessionDay && dayExternals.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border space-y-1">
                        {dayExternals.map(ext => (
                          <ExternalSessionCard key={ext.id} session={ext} compact />
                        ))}
                      </div>
                    )}
                  </div>
                </DraggableDayCard>

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
      </DndContext>
      {swapSourceDay !== null && swapTargetDay !== null && (
        <SessionSwapModal
          open={swapModalOpen}
          onClose={() => { setSwapModalOpen(false); setSwapMode(false); setSwapSourceDay(null); setSwapTargetDay(null); }}
          onConfirm={handleSwapConfirm}
          sessionName={effectiveSessions[swapSourceDay]?.name || "Session"}
          fromDayIndex={swapSourceDay}
          toDayIndex={swapTargetDay}
          fromDate={dates[swapSourceDay].date}
          toDate={dates[swapTargetDay].date}
          isMutualSwap={targetHasSession}
          targetSessionName={targetHasSession ? effectiveSessions[swapTargetDay]?.name : undefined}
        />
      )}

      <ExternalSessionForm
        open={externalFormOpen}
        onClose={() => { setExternalFormOpen(false); setEditingExternal(null); }}
        onSubmit={handleExternalSubmit}
        date={externalFormDate}
        initialData={editingExternal}
      />

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
