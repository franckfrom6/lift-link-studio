import { Calendar, ChevronLeft, ChevronRight, Dumbbell, Play, CheckCircle, Clock, Target, ArrowLeftRight, X, Plus, Utensils, RefreshCw, Bot, Copy, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
import FirstStepsChecklist from "@/components/onboarding/FirstStepsChecklist";
import DateBadge, { DateBadgeVariant } from "@/components/student/DateBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import SessionSwapModal from "@/components/student/SessionSwapModal";
import SwapBadge from "@/components/student/SwapBadge";
import ExternalSessionForm from "@/components/student/ExternalSessionForm";
import ExternalSessionCard from "@/components/student/ExternalSessionCard";
import WeeklyCheckinForm from "@/components/student/WeeklyCheckinForm";
import CheckinBadge from "@/components/student/CheckinBadge";
import WeeklyLoadBar from "@/components/student/WeeklyLoadBar";
import SelfGuidedDashboard from "@/components/student/SelfGuidedDashboard";
import FreeSessionCreator from "@/components/student/FreeSessionCreator";
import SessionBuilderModal from "@/components/student/SessionBuilderModal";
import DuplicateSessionModal from "@/components/student/DuplicateSessionModal";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { useStudentProgram } from "@/hooks/useStudentProgram";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionSwaps } from "@/hooks/useSessionSwaps";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { DraggableDayCard } from "@/components/student/DraggableDayCard";
import { supabase } from "@/integrations/supabase/client";
import { useWeekData } from "@/hooks/useWeekData";

const StudentWeek = () => {
  const { t, i18n } = useTranslation(['calendar', 'common', 'session']);
  const { user } = useAuth();
  const isAdvanced = useIsAdvanced();
  const queryClient = useQueryClient();
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
  const [freeSessionOpen, setFreeSessionOpen] = useState(false);
  const [freeSessionDate, setFreeSessionDate] = useState<Date>(new Date());
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderDate, setBuilderDate] = useState<Date>(new Date());
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateSession, setDuplicateSession] = useState<{ id: string; name: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; isFreeSession: boolean } | null>(null);

  const totalWeeks = program?.weeks?.length || 0;

  const selectedWeekIndex = useMemo(() => {
    if (!program || totalWeeks === 0) return 0;
    const created = new Date(program.created_at);
    const cDay = created.getDay();
    const cMonday = new Date(created);
    cMonday.setDate(cMonday.getDate() - cDay + (cDay === 0 ? -6 : 1));
    cMonday.setHours(0, 0, 0, 0);
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
  const { swaps: dbSwaps, createSwap } = useSessionSwaps(weekStart);

  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;

  const {
    currentCheckin,
    weekExternals,
    externalFormOpen,
    setExternalFormOpen,
    externalFormDate,
    editingExternal,
    setEditingExternal,
    checkinFormOpen,
    setCheckinFormOpen,
    handleExternalSubmit,
    handleDeleteExternal,
    handleCheckinSubmit,
    handleAddExternal,
    getFreeForDay,
    getExternalForDay,
    freeSessions,
  } = useWeekData(studentId, weekStart);

  // Fetch free sessions callback for FreeSessionCreator
  const fetchFreeSessions = useCallback(async () => {
    // Re-trigger by changing weekOffset slightly - the hook will refetch
    setWeekOffset(prev => prev);
  }, []);

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

  const visibleSessionIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(effectiveSessions).forEach((session) => ids.add(session.sessionId));
    freeSessions.forEach((session) => ids.add(session.id));
    return Array.from(ids);
  }, [effectiveSessions, freeSessions]);

  const { data: completedSessionIds = new Set<string>() } = useQuery<Set<string>>({
    queryKey: ["week-completed-sessions", studentId, visibleSessionIds.join(",")],
    queryFn: async () => {
      if (!studentId || visibleSessionIds.length === 0) return new Set<string>();

      const { data, error } = await supabase
        .from("completed_sessions")
        .select("session_id")
        .eq("student_id", studentId)
        .in("session_id", visibleSessionIds)
        .not("completed_at", "is", null);

      if (error) {
        console.error("Error fetching completed sessions:", error);
        return new Set<string>();
      }

      return new Set((data || []).map((row) => row.session_id));
    },
    enabled: !!studentId && visibleSessionIds.length > 0,
    staleTime: 30 * 1000,
  });

  const isSessionCompleted = useCallback((sessionId: string) => completedSessionIds.has(sessionId), [completedSessionIds]);

  const swappedDays = useMemo(() => {
    const map: Record<number, { originalDay: number; reason: string | null }> = {};
    for (const swap of mappedSwaps) {
      map[swap.newDay] = { originalDay: swap.originalDay + 1, reason: swap.reason };
    }
    return map;
  }, [mappedSwaps]);

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

  const handleDeleteSession = async () => {
    if (!deleteTarget || !user) return;

    const { data: completedSession, error: completedErr } = await supabase
      .from("completed_sessions")
      .select("id")
      .eq("student_id", user.id)
      .eq("session_id", deleteTarget.id)
      .not("completed_at", "is", null)
      .maybeSingle();

    if (completedErr) {
      console.error("Error checking completed session:", completedErr);
      toast.error(t("common:error"));
      return;
    }

    if (completedSession) {
      toast.error(t("session:session_already_completed"));
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      return;
    }

    const { data: updatedSession, error } = await supabase
      .from("sessions")
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq("id", deleteTarget.id)
      .eq("is_deleted", false)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Error deleting session:", error);
      toast.error(t("common:error"));
      return;
    }

    if (!updatedSession) {
      toast.error(t("session:session_already_completed"));
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["student-program"] });
    if (deleteTarget.isFreeSession) {
      await queryClient.invalidateQueries({ queryKey: ["week-free-sessions"] });
    }
    toast.success(t("session:session_deleted"));

    const { data: coachRel } = await supabase
      .from("coach_students")
      .select("coach_id")
      .eq("student_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (coachRel?.coach_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const athleteName = profile?.full_name || user.email?.split("@")[0] || "Athlète";
      await supabase.from("coach_notifications").insert({
        coach_id: coachRel.coach_id,
        student_id: user.id,
        message: `${athleteName} a supprimé la séance "${deleteTarget.name}"`,
      });
    }

    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const targetHasSession = swapTargetDay !== null && !!effectiveSessions[swapTargetDay];
  const sourceDayHasSession = swapSourceDay !== null && !!effectiveSessions[swapSourceDay];
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  if (programLoading) {
    return (
      <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto relative">
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
          onJoinCoach={async (code) => {
            if (!user) return;
            const { data: tokenData } = await supabase
              .from("coach_invite_tokens")
              .select("id, coach_id, token, uses_count, max_uses, expires_at")
              .eq("token", code.toUpperCase())
              .eq("is_active", true)
              .maybeSingle();

            if (!tokenData) {
              toast.error(t('auth:token_invalid', "Code invalide ou expiré"));
              return;
            }

            if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
              toast.error(t('auth:token_invalid', "Code invalide ou expiré"));
              return;
            }
            if (tokenData.max_uses !== null && tokenData.uses_count >= tokenData.max_uses) {
              toast.error(t('auth:token_invalid', "Code invalide ou expiré"));
              return;
            }

            const { data: existing } = await supabase
              .from("coach_students")
              .select("id")
              .eq("coach_id", tokenData.coach_id)
              .eq("student_id", user.id)
              .eq("status", "active")
              .maybeSingle();

            if (existing) {
              toast.info(t('auth:token_join_already', "Vous êtes déjà associé à ce coach"));
              return;
            }

            const { error } = await supabase.from("coach_students").insert({
              coach_id: tokenData.coach_id,
              student_id: user.id,
              status: "active",
            });

            if (error) {
              toast.error(t('auth:error_generic'));
              return;
            }

            await supabase
              .from("coach_invite_tokens")
              .update({ uses_count: tokenData.uses_count + 1 })
              .eq("id", tokenData.id);

            toast.success(t('auth:token_join_success', "Vous avez rejoint le coach !"));
            window.location.reload();
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset - 1)} aria-label={t('calendar:previous_week', 'Previous week')}>
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
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset + 1)} aria-label={t('calendar:next_week', 'Next week')}>
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>

      {weekOffset === 0 && (
        <CheckinBadge
          checkin={currentCheckin}
          onClick={() => setCheckinFormOpen(true)}
        />
      )}

      {isAdvanced && (programmedCount > 0 || weekExternals.length > 0) && (
        <WeeklyLoadBar
          programmedSessions={programmedCount}
          externalSessions={weekExternals}
        />
      )}

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
            aria-label={t('common:cancel')}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="space-y-2">
          {dates.map((day) => {
            const isSessionDay = day.hasSession;
            const sessionInfo = effectiveSessions[day.dayIndex];
            const sessionCompleted = isSessionDay && !!sessionInfo && isSessionCompleted(sessionInfo.sessionId);
            const swapInfo = swappedDays[day.dayIndex];
            const isSwapSource = swapMode && day.dayIndex === swapSourceDay;
            const isDropTarget = swapMode && day.dayIndex !== swapSourceDay;
            const dayExternals = getExternalForDay(day.date);
            const dayFreeSessions = getFreeForDay(day.date);

            return (
              <div key={day.name} className="space-y-1">
                <DraggableDayCard
                  dayIndex={day.dayIndex}
                  hasSession={isSessionDay}
                  onMoveUp={isSessionDay && day.dayIndex > 0 ? () => { setSwapSourceDay(day.dayIndex); setSwapTargetDay(day.dayIndex - 1); setSwapModalOpen(true); } : undefined}
                  onMoveDown={isSessionDay && day.dayIndex < 6 ? () => { setSwapSourceDay(day.dayIndex); setSwapTargetDay(day.dayIndex + 1); setSwapModalOpen(true); } : undefined}
                  className={cn(
                    "group/day w-full glass p-4 transition-all text-left touch-manipulation",
                    day.isToday && "ring-1 ring-primary/40",
                    isSessionDay && !swapMode && "hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] cursor-pointer",
                    !isSessionDay && dayExternals.length === 0 && dayFreeSessions.length === 0 && !swapMode && "opacity-50",
                    isSwapSource && "ring-2 ring-warning bg-warning-bg",
                    isDropTarget && "ring-1 ring-dashed ring-warning/50 cursor-pointer hover:ring-warning hover:bg-warning-bg/50",
                  )}
                >
                  <div
                    className="relative"
                    role={swapMode || (isSessionDay && sessionInfo) ? "button" : undefined}
                    tabIndex={swapMode || (isSessionDay && sessionInfo) ? 0 : undefined}
                    onClick={() => {
                      if (swapMode) {
                        handleDayClickInSwapMode(day.dayIndex);
                      } else if (isSessionDay && sessionInfo) {
                        navigate(`/student/session/${sessionInfo.sessionId}`);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (swapMode) handleDayClickInSwapMode(day.dayIndex);
                        else if (isSessionDay && sessionInfo) navigate(`/student/session/${sessionInfo.sessionId}`);
                      }
                    }}
                  >

                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <DateBadge
                          day={day.date.getDate()}
                          dayName={day.name}
                          variant={
                            sessionCompleted ? "completed"
                              : day.isToday ? "today"
                              : (isSessionDay || dayFreeSessions.length > 0) ? "active"
                              : "rest" as DateBadgeVariant
                          }
                        />
                        <div className="pt-0.5 flex-1 min-w-0">
                          {swapInfo && (
                            <div className="mb-0.5">
                              <SwapBadge originalDay={swapInfo.originalDay} newDay={day.dayIndex + 1} reason={swapInfo.reason} />
                            </div>
                          )}
                          {isSessionDay && sessionInfo ? (
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-foreground truncate">{sessionInfo.name}</p>
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
                          ) : dayFreeSessions.length > 0 ? (
                            <div className="space-y-1">
                              {dayFreeSessions.map(fs => {
                                const freeSessionCompleted = isSessionCompleted(fs.id);

                                return (
                                  <div
                                    key={fs.id}
                                    className="group/free-session relative space-y-0.5 cursor-pointer pr-8"
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/student/session/${fs.id}`); }}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); navigate(`/student/session/${fs.id}`); } }}
                                  >
                                    {!freeSessionCompleted && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-6 w-6 p-1 rounded-full text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/10 sm:opacity-30 sm:group-hover/day:opacity-100"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDeleteTarget({ id: fs.id, name: fs.name, isFreeSession: true });
                                          setDeleteDialogOpen(true);
                                        }}
                                        aria-label={t('session:delete_session')}
                                      >
                                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                                      </Button>
                                    )}

                                    <div className="flex items-center gap-1.5">
                                      <p className="text-sm font-bold text-foreground truncate">{fs.name}</p>
                                      <span className="inline-flex items-center gap-0.5 bg-ai-bg text-ai text-[9px] font-semibold px-1.5 py-0.5 rounded-md border border-ai/15 shrink-0">
                                        <Bot className="w-2.5 h-2.5" strokeWidth={1.5} />
                                        IA
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-muted-foreground">{fs.exerciseCount} ex.</span>
                                    </div>
                                  </div>
                                );
                              })}
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

                          {isSessionDay && dayFreeSessions.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-border space-y-1">
                             {dayFreeSessions.map(fs => {
                                const freeSessionCompleted = isSessionCompleted(fs.id);

                                return (
                                  <div
                                    key={fs.id}
                                    className="group/free-session relative space-y-0.5 cursor-pointer pr-8"
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/student/session/${fs.id}`); }}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); navigate(`/student/session/${fs.id}`); } }}
                                  >
                                    {!freeSessionCompleted && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-6 w-6 p-1 rounded-full text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/10 sm:opacity-30 sm:group-hover/day:opacity-100"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDeleteTarget({ id: fs.id, name: fs.name, isFreeSession: true });
                                          setDeleteDialogOpen(true);
                                        }}
                                        aria-label={t('session:delete_session')}
                                      >
                                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                                      </Button>
                                    )}

                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate">{fs.name}</p>
                                        <span className="inline-flex items-center gap-0.5 bg-ai-bg text-ai text-[8px] font-semibold px-1 py-0.5 rounded shrink-0">
                                          <Bot className="w-2 h-2" strokeWidth={1.5} />
                                          IA
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{fs.exerciseCount} ex.</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSessionDay && !swapMode && (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); setDuplicateSession({ id: sessionInfo!.sessionId, name: sessionInfo!.name }); setDuplicateOpen(true); }}
                              aria-label={t('session:duplicate_title', 'Duplicate session')}
                            >
                              <Copy className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); setSwapMode(true); setSwapSourceDay(day.dayIndex); }}
                              aria-label={t('calendar:swap_session', 'Swap session')}
                            >
                              <ArrowLeftRight className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                          </>
                        )}
                        {!swapMode && (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); setBuilderDate(day.date); setBuilderOpen(true); }}
                              aria-label={t('session:builder_title')}
                            >
                              <Dumbbell className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); handleAddExternal(day.date); }}
                              aria-label={t('calendar:add_external', 'Add external activity')}
                            >
                              <Plus className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                          </>
                        )}
                        {(isSessionDay || dayFreeSessions.length > 0) && !day.isPast && !swapMode ? (
                          <button
                            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg cursor-pointer"
                            aria-label={t('session:start_session', 'Start session')}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSessionDay && sessionInfo) {
                                navigate(`/student/session/${sessionInfo.sessionId}`);
                              } else if (dayFreeSessions.length > 0) {
                                navigate(`/student/session/${dayFreeSessions[0].id}`);
                              }
                            }}
                          >
                            <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span className="text-xs font-semibold">Go</span>
                          </button>
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
                        onEdit={() => { setEditingExternal(ext); setExternalFormOpen(true); }}
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

      <FreeSessionCreator
        open={freeSessionOpen}
        onClose={() => setFreeSessionOpen(false)}
        date={freeSessionDate}
        onCreated={() => fetchFreeSessions()}
      />

      <SessionBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        date={builderDate}
        onCreated={() => fetchFreeSessions()}
      />

      {duplicateSession && (
        <DuplicateSessionModal
          open={duplicateOpen}
          onClose={() => { setDuplicateOpen(false); setDuplicateSession(null); }}
          sessionId={duplicateSession.id}
          sessionName={duplicateSession.name}
          programId={program?.id}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('session:delete_session_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('session:delete_session_desc', { name: deleteTarget?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}>
              {t('common:cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('session:delete_session_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* First steps checklist */}
      <FirstStepsChecklist />

      {/* Onboarding tooltips */}
      <OnboardingTooltip
        stepKey="welcome_seen"
        title={t('common:onboarding_welcome_title')}
        description={t('common:onboarding_welcome_desc')}
        position="center"
      />
      <OnboardingTooltip
        stepKey="program_seen"
        title={t('common:onboarding_program_title')}
        description={t('common:onboarding_program_desc')}
        position="bottom"
      />
    </div>
  );
};

export default StudentWeek;
