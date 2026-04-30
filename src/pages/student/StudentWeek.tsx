import { Dumbbell, ArrowLeftRight, X, Plus, RefreshCw, Bot, Copy, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
import FirstStepsChecklist from "@/components/onboarding/FirstStepsChecklist";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SessionSwapModal from "@/components/student/SessionSwapModal";
import ExternalSessionForm from "@/components/student/ExternalSessionForm";
import ExternalSessionCard from "@/components/student/ExternalSessionCard";
import WeeklyCheckinForm from "@/components/student/WeeklyCheckinForm";
import CheckinBadge from "@/components/student/CheckinBadge";
import WeeklyLoadBar from "@/components/student/WeeklyLoadBar";
import FreeSessionCreator from "@/components/student/FreeSessionCreator";
import SessionBuilderModal from "@/components/student/SessionBuilderModal";
import DuplicateSessionModal from "@/components/student/DuplicateSessionModal";
import SignatureStartCTA from "@/components/student/SignatureStartCTA";
import ProgWeekSelector, { ProgWeekSelectorItem } from "@/components/student/ProgWeekSelector";
import ProgWeekHeader from "@/components/student/ProgWeekHeader";
import ProgDayRow, { DayState } from "@/components/student/ProgDayRow";
import WeekRangePicker from "@/components/student/WeekRangePicker";
import NoProgramOnboardingBanner from "@/components/student/NoProgramOnboardingBanner";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useStudentProgram } from "@/hooks/useStudentProgram";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionSwaps } from "@/hooks/useSessionSwaps";
import { supabase } from "@/integrations/supabase/client";
import { useWeekData } from "@/hooks/useWeekData";
import { AnimatePresence, motion } from "framer-motion";

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
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
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

  const fetchFreeSessions = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['week-free-sessions'] });
  }, [queryClient]);

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
      if (error) return new Set<string>();
      return new Set((data || []).map((row) => row.session_id));
    },
    enabled: !!studentId && visibleSessionIds.length > 0,
    staleTime: 30 * 1000,
  });

  const isSessionCompleted = useCallback((sessionId: string) => completedSessionIds.has(sessionId), [completedSessionIds]);

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

  // Auto-select today's index
  useEffect(() => {
    if (selectedDayIndex !== null) return;
    const todayIdx = dates.findIndex(d => d.isToday);
    setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0);
  }, [dates, selectedDayIndex]);

  // Completed sessions count for ring
  const completedSessionCount = useMemo(() => {
    let count = 0;
    Object.values(effectiveSessions).forEach(s => {
      if (completedSessionIds.has(s.sessionId)) count++;
    });
    return count;
  }, [effectiveSessions, completedSessionIds]);

  // Today's focus session
  const todayFocus = useMemo(() => {
    const todayIdx = dates.findIndex(d => d.isToday);
    if (todayIdx < 0) return null;
    const session = effectiveSessions[todayIdx];
    const dayFree = getFreeForDay(dates[todayIdx].date);
    if (session) {
      return {
        name: session.name,
        sessionId: session.sessionId,
        exerciseCount: session.exerciseCount,
        muscleGroups: session.muscleGroups,
        isCompleted: completedSessionIds.has(session.sessionId),
      };
    }
    if (dayFree.length > 0) {
      return {
        name: dayFree[0].name,
        sessionId: dayFree[0].id,
        exerciseCount: dayFree[0].exerciseCount,
        muscleGroups: [],
        isCompleted: completedSessionIds.has(dayFree[0].id),
      };
    }
    return null;
  }, [dates, effectiveSessions, completedSessionIds, getFreeForDay]);

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
    if (!deleteTarget || !user || !studentId) return;

    // Delete any completed session records first
    await supabase
      .from("completed_sessions")
      .delete()
      .eq("student_id", studentId)
      .eq("session_id", deleteTarget.id);

    const { data: updatedSession, error } = await supabase
      .from("sessions")
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq("id", deleteTarget.id)
      .eq("is_deleted", false)
      .select("id")
      .maybeSingle();

    if (error) {
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
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();

    if (coachRel?.coach_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", studentId)
        .maybeSingle();

      const athleteName = profile?.full_name || user.email?.split("@")[0] || "Athlète";
      await supabase.from("coach_notifications").insert({
        coach_id: coachRel.coach_id,
        student_id: studentId,
        message: JSON.stringify({
          key: "session_deleted_by_athlete",
          athlete: athleteName,
          session: deleteTarget.name
        }),
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

  // No structured program → handler reused by the inline onboarding banner
  const handleJoinCoach = async (code: string) => {
    if (!user) return;
    const upper = code.toUpperCase();
    const { data: tokenData } = await supabase
      .from("coach_invite_tokens")
      .select("id, coach_id, token, uses_count, max_uses, expires_at")
      .eq("token", upper)
      .eq("is_active", true)
      .maybeSingle();

    if (!tokenData) { toast.error(t('auth:token_invalid', "Code invalide ou expiré")); return; }
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) { toast.error(t('auth:token_invalid')); return; }
    if (tokenData.max_uses !== null && tokenData.uses_count >= tokenData.max_uses) { toast.error(t('auth:token_invalid')); return; }

    const { data: existing } = await supabase
      .from("coach_students")
      .select("id")
      .eq("coach_id", tokenData.coach_id)
      .eq("student_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) { toast.info(t('auth:token_join_already')); return; }

    const { error } = await supabase.from("coach_students").insert({
      coach_id: tokenData.coach_id,
      student_id: user.id,
      status: "active",
    });

    if (error) { toast.error(t('auth:error_generic')); return; }

    await supabase
      .from("coach_invite_tokens")
      .update({ uses_count: tokenData.uses_count + 1 })
      .eq("id", tokenData.id);

    toast.success(t('auth:token_join_success'));
    window.location.reload();
  };

  // Sage Phase 4 — week selector strip data
  const programWeeks: ProgWeekSelectorItem[] = useMemo(() => {
    if (!program) return [];
    return (program.weeks || []).map((w, idx) => {
      const total = w.sessions?.length || 0;
      const isCurrent = idx === selectedWeekIndex;
      const isPast = idx < selectedWeekIndex;
      const isFuture = idx > selectedWeekIndex;
      // For the current week we know the actual count; for past weeks we
      // assume the program was followed (best-effort visual). Future weeks = 0.
      const completed = isCurrent ? completedSessionCount : isPast ? total : 0;
      return {
        num: idx + 1,
        completed,
        total,
        state: isCurrent ? "current" : isPast ? "past" : "future",
      };
    });
  }, [program, selectedWeekIndex, completedSessionCount]);

  // Week range label, e.g. "lun. 13 — dim. 19 janv."
  const weekRangeLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = new Intl.DateTimeFormat(i18n.language || "fr", { weekday: "short", day: "numeric" });
    const fmtMonth = new Intl.DateTimeFormat(i18n.language || "fr", { month: "short" });
    return `${fmt.format(weekStart)} — ${fmt.format(end)} ${fmtMonth.format(end)}`;
  }, [weekStart, i18n.language]);

  const weekLabel =
    weekOffset === 0 ? t('calendar:this_week')
      : weekOffset === -1 ? t('calendar:last_week')
      : weekOffset === 1 ? t('calendar:next_week')
      : t('calendar:week_offset', { offset: weekOffset });

  // Total sessions in the displayed week (including free sessions)
  const totalWeekSessions = programmedCount + freeSessions.length;

  // Map week-strip selection (1-based S{n}) to weekOffset
  const handleSelectStripWeek = (num: number) => {
    const newWeekIdx = num - 1;
    const delta = newWeekIdx - selectedWeekIndex;
    if (delta === 0) return;
    setWeekOffset(weekOffset + delta);
    setSelectedDayIndex(null);
  };

  // Jump to the Monday of any given date (used by the mini-calendar picker).
  const handleJumpToDate = (date: Date) => {
    const target = new Date(date);
    const day = target.getDay();
    const monday = new Date(target);
    monday.setDate(target.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    const today = new Date();
    const todayDay = today.getDay();
    const todayMonday = new Date(today);
    todayMonday.setDate(today.getDate() - todayDay + (todayDay === 0 ? -6 : 1));
    todayMonday.setHours(0, 0, 0, 0);
    const offset = Math.round((monday.getTime() - todayMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    setWeekOffset(offset);
    setSelectedDayIndex(null);
  };

  const handleJumpToday = () => {
    setWeekOffset(0);
    setSelectedDayIndex(null);
  };

  const hasProgram = !!program;
  // Athlete is in "compose" mode when no program is loaded.
  // Banner collapses once a free session exists somewhere in the week.
  const bannerCollapsedByDefault = freeSessions.length > 0;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto relative pb-32 md:pb-0">
      {refreshing && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full animate-pulse">
          <RefreshCw className="h-3 w-3 animate-spin" />
          {t('common:refreshing', 'Mise à jour…')}
        </div>
      )}

      {/* Sage Phase 4 — Header (program/meso + week badge) */}
      <header className="px-4 pt-4 pb-3 flex items-center justify-between gap-3 border-b border-border">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-subtle truncate">
            {hasProgram ? program!.name : t('calendar:hello', { name: userName })}
          </p>
          <h1 className="text-lg font-bold tracking-tight text-foreground mt-0.5">
            {t('calendar:program_title', 'Programme')}
          </h1>
        </div>
        {hasProgram && (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-card border border-border rounded-sm flex-shrink-0">
            <span className="text-xs font-bold tabular-nums text-foreground">S{selectedWeekIndex + 1}</span>
            <span className="text-[11px] text-muted-subtle font-medium">/ {totalWeeks}</span>
          </div>
        )}
      </header>

      {/* No-program onboarding banner */}
      {!hasProgram && (
        <NoProgramOnboardingBanner
          collapsedByDefault={bannerCollapsedByDefault}
          onStartAI={() => {
            toast.info(t('calendar:ai_coming_soon', "La génération IA de programme arrive bientôt !"));
          }}
          onJoinCoach={handleJoinCoach}
        />
      )}

      {/* Week strip — programmes structurés uniquement */}
      {hasProgram && programWeeks.length > 1 && (
        <ProgWeekSelector
          weeks={programWeeks}
          current={selectedWeekIndex + 1}
          onSelect={handleSelectStripWeek}
        />
      )}

      {/* Week summary with interactive mini-calendar */}
      <ProgWeekHeader
        label={weekLabel}
        range={weekRangeLabel}
        completedSessions={completedSessionCount}
        totalSessions={totalWeekSessions}
        labelSlot={
          <WeekRangePicker
            weekStart={weekStart}
            label={weekLabel}
            range={weekRangeLabel}
            onSelectDate={handleJumpToDate}
            onJumpToday={handleJumpToday}
            isCurrentWeek={weekOffset === 0}
          />
        }
      />

      {/* Check-in banner — only on current week */}
      {weekOffset === 0 && (
        <div className="px-4 pb-2">
          <CheckinBadge
            checkin={currentCheckin}
            onClick={() => setCheckinFormOpen(true)}
          />
        </div>
      )}

      {/* Weekly load (Pro mode) */}
      <AnimatePresence mode="wait">
        {isAdvanced && (programmedCount > 0 || weekExternals.length > 0) && (
          <motion.div
            key="weekly-load"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2"
          >
            <WeeklyLoadBar
              programmedSessions={programmedCount}
              externalSessions={weekExternals}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap mode banner */}
      {swapMode && (
        <div className="mx-4 mb-2 flex items-center justify-between bg-warning-bg text-warning rounded-sm px-4 py-2.5 text-sm font-medium animate-fade-in border border-warning/30">
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

      {/* Chronological day list */}
      <div className="border-y border-border">
        {dates.map((day, i) => {
          const isSessionDay = day.hasSession;
          const sessionInfo = effectiveSessions[day.dayIndex];
          const sessionCompleted = isSessionDay && !!sessionInfo && isSessionCompleted(sessionInfo.sessionId);
          const dayExternals = getExternalForDay(day.date);
          const dayFreeSessions = getFreeForDay(day.date);
          const isLast = i === dates.length - 1;

          // Determine state
          let state: DayState = "rest";
          if (isSessionDay || dayFreeSessions.length > 0) {
            if (sessionCompleted || (dayFreeSessions[0] && isSessionCompleted(dayFreeSessions[0].id))) {
              state = "done";
            } else if (day.isToday) {
              state = "today";
            } else if (day.isPast) {
              state = "past";
            } else {
              state = "planned";
            }
          }

          // Build the click handler
          const handleClick = () => {
            if (swapMode) { handleDayClickInSwapMode(day.dayIndex); return; }
            if (isSessionDay && sessionInfo) {
              navigate(`/student/session/${sessionInfo.sessionId}/preview`);
            } else if (dayFreeSessions.length > 0) {
              navigate(`/student/session/${dayFreeSessions[0].id}/preview`);
            } else if (!day.isPast) {
              // Rest day on current/future date → open builder directly
              setBuilderDate(day.date);
              setBuilderOpen(true);
            }
          };

          // Pick what to show as session name/meta
          let sessionName: string | null = null;
          let sessionMeta: string | null = null;
          let isAI = false;
          if (isSessionDay && sessionInfo) {
            sessionName = sessionInfo.name;
            const parts: string[] = [`${sessionInfo.exerciseCount} ex.`];
            if (sessionInfo.muscleGroups.length > 0) {
              parts.push(sessionInfo.muscleGroups.slice(0, 3).join(", "));
            }
            sessionMeta = parts.join(" · ");
          } else if (dayFreeSessions.length > 0) {
            const fs = dayFreeSessions[0];
            sessionName = fs.name;
            sessionMeta = `${fs.exerciseCount} ex.`;
            isAI = true;
          }

          // Action menu (kept feature parity with previous version)
          const hasMenu = !swapMode && (isSessionDay || !day.isPast);
          const actionMenu = hasMenu ? (
            <>
              <DropdownMenuItem onClick={() => { setBuilderDate(day.date); setBuilderOpen(true); }}>
                <Dumbbell className="w-4 h-4 mr-2" />{t('session:builder_title')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddExternal(day.date)}>
                <Plus className="w-4 h-4 mr-2" />{t('calendar:log_activity')}
              </DropdownMenuItem>
              {isSessionDay && sessionInfo && (
                <>
                  <DropdownMenuItem onClick={() => { setDuplicateSession({ id: sessionInfo.sessionId, name: sessionInfo.name }); setDuplicateOpen(true); }}>
                    <Copy className="w-4 h-4 mr-2" />{t('session:duplicate_title')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSwapMode(true); setSwapSourceDay(day.dayIndex); }}>
                    <ArrowLeftRight className="w-4 h-4 mr-2" />{t('calendar:swap_session')}
                  </DropdownMenuItem>
                </>
              )}
              {isSessionDay && sessionInfo && !sessionCompleted && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => { setDeleteTarget({ id: sessionInfo.sessionId, name: sessionInfo.name, isFreeSession: false }); setDeleteDialogOpen(true); }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />{t('session:delete_session')}
                </DropdownMenuItem>
              )}
              {dayFreeSessions[0] && !isSessionCompleted(dayFreeSessions[0].id) && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => { setDeleteTarget({ id: dayFreeSessions[0].id, name: dayFreeSessions[0].name, isFreeSession: true }); setDeleteDialogOpen(true); }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />{t('session:delete_session')}
                </DropdownMenuItem>
              )}
            </>
          ) : null;

          // Extra content below the row: external activities + secondary free sessions
          const extras = (
            <>
              {dayExternals.length > 0 && (
                <div className="space-y-1 mt-1">
                  {dayExternals.map(ext => (
                    <ExternalSessionCard
                      key={ext.id}
                      session={ext}
                      compact
                      onEdit={!isSessionDay ? () => { setEditingExternal(ext); setExternalFormOpen(true); } : undefined}
                      onDelete={!isSessionDay ? () => handleDeleteExternal(ext.id!) : undefined}
                    />
                  ))}
                </div>
              )}
              {isSessionDay && dayFreeSessions.length > 0 && (
                <div className="space-y-1 mt-1 pt-1 border-t border-border">
                  {dayFreeSessions.map(fs => (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/student/session/${fs.id}/preview`); }}
                      className="flex items-center justify-between w-full text-left py-1"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">{fs.name}</span>
                        <span className="inline-flex items-center gap-0.5 bg-bg-tinted text-muted-foreground text-[8px] font-bold uppercase px-1 py-[1px] rounded-xs">
                          <Bot className="w-2 h-2" strokeWidth={2} />IA
                        </span>
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-subtle ml-2">{fs.exerciseCount} ex.</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          );

          // On rest days, expose the same action ("add a session") through both
          // the row click and the menu so creating a session on a week without
          // a program is intuitive.
          const restDayClickable = state === "rest" && !day.isPast && !swapMode;
          const rowOnClick = state === "rest"
            ? (restDayClickable ? handleClick : undefined)
            : handleClick;

          return (
            <ProgDayRow
              key={day.name}
              dayIndex={day.dayIndex}
              date={day.date}
              state={state}
              isLast={isLast}
              sessionName={sessionName}
              sessionMeta={sessionMeta}
              isAI={isAI}
              onClick={rowOnClick}
              actionMenu={actionMenu}
            >
              {(dayExternals.length > 0 || (isSessionDay && dayFreeSessions.length > 0)) ? extras : null}
            </ProgDayRow>
          );
        })}
      </div>

      {/* Floating "Démarrer la séance" CTA — replaces the mobile bottom nav on /student */}
      {weekOffset === 0 && todayFocus && (
        <SignatureStartCTA
          sessionId={todayFocus.sessionId}
          sessionName={todayFocus.name}
          exerciseCount={todayFocus.exerciseCount}
          muscleGroups={todayFocus.muscleGroups}
          weekIndex={selectedWeekIndex}
          totalWeeks={totalWeeks}
          isCompleted={todayFocus.isCompleted}
        />
      )}

      {/* Modals */}
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

      <FirstStepsChecklist />
      <OnboardingTooltip stepKey="welcome_seen" title={t('common:onboarding_welcome_title')} description={t('common:onboarding_welcome_desc')} position="center" />
      <OnboardingTooltip stepKey="program_seen" title={t('common:onboarding_program_title')} description={t('common:onboarding_program_desc')} position="bottom" />
    </div>
  );
};

export default StudentWeek;
