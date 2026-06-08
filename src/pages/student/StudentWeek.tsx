import { Dumbbell, ArrowLeftRight, X, Plus, RefreshCw, Copy, Trash2, Activity, Zap, Check, ChevronRight, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
import FirstStepsChecklist from "@/components/onboarding/FirstStepsChecklist";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { startOfISOWeek, differenceInCalendarISOWeeks } from "date-fns";
import SessionSwapModal from "@/components/student/SessionSwapModal";
import ExternalSessionForm from "@/components/student/ExternalSessionForm";
import ExternalSessionCard from "@/components/student/ExternalSessionCard";
import WeeklyCheckinForm from "@/components/student/WeeklyCheckinForm";
import CheckinBadge from "@/components/student/CheckinBadge";
import WeeklyLoadBar from "@/components/student/WeeklyLoadBar";
import FreeSessionCreator from "@/components/student/FreeSessionCreator";
import SessionBuilderModal from "@/components/student/SessionBuilderModal";
import SessionTypeChooser from "@/components/student/SessionTypeChooser";
import RunBlockEditor from "@/components/student/RunBlockEditor";
import { HybridSessionBuilder } from "@/components/hybrid/HybridSessionBuilder";
import type { HybridBlock } from "@/types/hybrid";
import RaceGoalCard from "@/components/student/RaceGoalCard";
import RaceGoalSetupSheet from "@/components/student/RaceGoalSetupSheet";
import { totalBlocksKm, type RunBlock } from "@/types/running";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import DuplicateSessionModal from "@/components/student/DuplicateSessionModal";
import SignatureStartCTA from "@/components/student/SignatureStartCTA";
import ProgDayRow, { DayState } from "@/components/student/ProgDayRow";
import MonthGrid, { MonthDayMarkers } from "@/components/student/MonthGrid";
import WeekStrip from "@/components/student/WeekStrip";
import MonthFilters, { ActivityFilter } from "@/components/student/MonthFilters";
import {
  CategoryKey,
  computeFocusCategories,
  activityTypeToSport,
} from "@/lib/session-categories";
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
import { useMonthSessions } from "@/hooks/useMonthSessions";
import { formatLocalDate } from "@/lib/date-utils";
import { AnimatePresence, motion } from "framer-motion";

// Route resolver based on session type (handles legacy untyped sessions)
const getSessionRoute = (id: string, sessionType?: string): string => {
  if (sessionType === 'running') return `/student/run/${id}`;
  if (sessionType === 'hybrid') return `/student/hybrid/${id}`;
  return `/student/session/${id}/preview`;
};

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
  // Free-navigation calendar state.
  // selectedDate = the day the user is focused on (detail row below grid).
  // displayMonth = which month the grid currently shows (can differ from
  // selectedDate when the user is browsing without picking a day yet).
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [monthNavDir, setMonthNavDir] = useState<'left' | 'right' | null>(null);
  // Calendar filters (scope + session type)
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<CategoryKey | null>(null);
  const navigate = useNavigate();
  const [swapMode, setSwapMode] = useState(false);
  const [swapSourceDay, setSwapSourceDay] = useState<number | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetDay, setSwapTargetDay] = useState<number | null>(null);
  const [swapSourceDate, setSwapSourceDate] = useState<Date | null>(null);
  const [swapTargetDate, setSwapTargetDate] = useState<Date | null>(null);
  const [freeSessionOpen, setFreeSessionOpen] = useState(false);
  const [freeSessionDate, setFreeSessionDate] = useState<Date>(new Date());
  const [builderOpen, setBuilderOpen] = useState(false);
  const [sessionChooserOpen, setSessionChooserOpen] = useState(false);
  const [sessionChooserDate, setSessionChooserDate] = useState<Date>(new Date());
  const [runSessionOpen, setRunSessionOpen] = useState(false);
  const [runSessionDate, setRunSessionDate] = useState<Date>(new Date());
  const [hybridOpen, setHybridOpen] = useState(false);
  const [hybridDate, setHybridDate] = useState<Date>(new Date());
  const [multiSessionOpen, setMultiSessionOpen] = useState(false);
  const [multiSessionDate, setMultiSessionDate] = useState<Date>(new Date());
  const [raceGoalSheetOpen, setRaceGoalSheetOpen] = useState(false);
  const [builderDate, setBuilderDate] = useState<Date>(new Date());
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateSession, setDuplicateSession] = useState<{ id: string; name: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; isFreeSession: boolean } | null>(null);
  // Self-guided "add a week" affordance state — declared early so all hooks
  // run on every render (the early `programLoading` return below would
  // otherwise skip these on the first render and trigger React error #310).
  const [addingWeek, setAddingWeek] = useState(false);

  const totalWeeks = program?.weeks?.length || 0;

  // Today + Monday-of(selectedDate) helpers.
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedMonday = useMemo(() => {
    return startOfISOWeek(new Date(selectedDate));
  }, [selectedDate]);

  const todayMonday = useMemo(() => {
    return startOfISOWeek(today);
  }, [today]);

  const weekOffset = useMemo(
    () => differenceInCalendarISOWeeks(selectedMonday, todayMonday),
    [selectedMonday, todayMonday]
  );

  const selectedWeekIndex = useMemo(() => {
    if (!program || totalWeeks === 0) return 0;
    const cMonday = startOfISOWeek(new Date(program.created_at));
    const diffWeeks = differenceInCalendarISOWeeks(selectedMonday, cMonday);
    if (diffWeeks < 0) return 0;
    return diffWeeks % totalWeeks;
  }, [program, totalWeeks, selectedMonday]);

  const currentWeek = program?.weeks?.[selectedWeekIndex];
  const weekSessions = currentWeek?.sessions || [];

  const DEFAULT_SESSIONS = useMemo(() => {
    const map: Record<number, { name: string; sessionId: string; exerciseCount: number; muscleGroups: string[]; session_type?: string }> = {};
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
        session_type: session.session_type ?? undefined,
      };
    }
    return map;
  }, [weekSessions]);

  const weekStart = selectedMonday;
  const { swaps: dbSwaps, createSwap } = useSessionSwaps(weekStart);

  // Week range label (e.g. "lun. 13 — dim. 19 janv.") — declared early so
  // hook order is stable across the `programLoading` early return below.
  const weekRangeLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = new Intl.DateTimeFormat(i18n.language || "fr", { weekday: "short", day: "numeric" });
    const fmtMonth = new Intl.DateTimeFormat(i18n.language || "fr", { month: "short" });
    return `${fmt.format(weekStart)} — ${fmt.format(end)} ${fmtMonth.format(end)}`;
  }, [weekStart, i18n.language]);

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

  const { data: raceGoal, refetch: refetchRaceGoal } = useQuery({
    queryKey: ["race-goal", studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("race_goals")
        .select("*")
        .eq("student_id", studentId!)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!studentId,
  });

  // Weekly running volume (sum of totalBlocksKm across this week's running sessions)
  const weekKeyStart = formatLocalDate(weekStart);
  const weekKeyEndDate = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return formatLocalDate(d);
  }, [weekStart]);

  const { data: weeklyRunKm = 0 } = useQuery({
    queryKey: ["week-running-km", studentId, weekKeyStart],
    queryFn: async () => {
      const { data } = await supabase
        .from("sessions")
        .select("run_blocks")
        .eq("created_by", studentId!)
        .eq("is_free_session", true)
        .eq("session_type", "running")
        .eq("is_deleted", false)
        .gte("free_session_date", weekKeyStart)
        .lte("free_session_date", weekKeyEndDate);
      return (data || []).reduce((acc: number, row: any) => {
        const blocks = (row.run_blocks || []) as RunBlock[];
        return acc + totalBlocksKm(blocks);
      }, 0);
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  });

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

  // Index (0..6) within the selected week of the currently-focused day.
  const selectedDayIndex = useMemo(() => {
    const dow = selectedDate.getDay();
    return (dow + 6) % 7;
  }, [selectedDate]);

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

  // ----- Monthly grid data -----
  const { summaries: monthSummaries } = useMonthSessions(studentId, displayMonth);

  /**
   * Build the per-day marker map shown in the grid.
   * Combines:
   *  - programmed sessions (from active program rotated over weeks)
   *  - free sessions (date-bound)
   *  - external activities
   *  - completion state (today + past)
   */
  const monthMarkers = useMemo(() => {
    const map = new Map<string, MonthDayMarkers>();
    const ensure = (key: string): MonthDayMarkers => {
      let v = map.get(key);
      if (!v) {
        v = {};
        map.set(key, v);
      }
      return v;
    };

    // 1) Date-bound items (free sessions / externals / completed)
    monthSummaries.forEach((s, key) => {
      const m = ensure(key);
      if (s.free > 0) {
        m.hasSession = true;
        m.sessionCount = (m.sessionCount ?? 0) + s.free;
      }
      if (s.external > 0) m.hasExternal = true;
      if (s.completed > 0) {
        m.hasSession = true;
        m.isCompleted = true;
        // completed is a superset of free — don't double-count
      }
    });

    // 2) Programmed sessions: rotate the program weeks across the displayed month.
    if (program && totalWeeks > 0) {
      const created = new Date(program.created_at);
      const cDow = created.getDay();
      const cMonday = new Date(created);
      cMonday.setDate(cMonday.getDate() - cDow + (cDow === 0 ? -6 : 1));
      cMonday.setHours(0, 0, 0, 0);

      const monthStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
      const monthEnd = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0);
      // Walk Mondays that intersect the month.
      const firstDow = monthStart.getDay();
      const monthGridStart = new Date(monthStart);
      monthGridStart.setDate(monthStart.getDate() - ((firstDow + 6) % 7));
      const cursor = new Date(monthGridStart);

      while (cursor <= monthEnd || cursor.getMonth() === displayMonth.getMonth()) {
        const diffWeeks = Math.round(
          (cursor.getTime() - cMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        if (diffWeeks >= 0) {
          const weekIdx = diffWeeks % totalWeeks;
          const wk = program.weeks[weekIdx];
          const sessionsByDay = new Set<number>(
            (wk?.sessions || []).map((s) => s.day_of_week - 1)
          );
          for (let i = 0; i < 7; i++) {
            if (!sessionsByDay.has(i)) continue;
            const d = new Date(cursor);
            d.setDate(cursor.getDate() + i);
            if (d.getMonth() !== displayMonth.getMonth()) continue;
            const key = formatLocalDate(d);
            const m = ensure(key);
            m.hasSession = true;
            m.sessionCount = (m.sessionCount ?? 0) + 1;
          }
        }
        cursor.setDate(cursor.getDate() + 7);
        if (cursor.getTime() > monthEnd.getTime() + 7 * 24 * 60 * 60 * 1000) break;
      }
    }

    return map;
  }, [monthSummaries, program, totalWeeks, displayMonth]);

  /**
   * Per-day category set for the displayed month.
   * Combines:
   *  - focus muscles from programmed sessions (rotated program weeks)
   *  - focus muscles from free sessions (date-bound)
   *  - sport family from external_sessions.activity_type
   *
   * The single Set<CategoryKey> per day powers both the dropdown
   * (available options) and the filter (what days to keep).
   */
  const monthCategoriesByDay = useMemo(() => {
    const map = new Map<string, Set<CategoryKey>>();
    const ensure = (key: string) => {
      let s = map.get(key);
      if (!s) {
        s = new Set<CategoryKey>();
        map.set(key, s);
      }
      return s;
    };

    // 1) External activities → sport families
    monthSummaries.forEach((s, key) => {
      if (!s.externalTypes || s.externalTypes.size === 0) return;
      const set = ensure(key);
      s.externalTypes.forEach((t) => set.add(activityTypeToSport(t)));
    });

    // 2) Free sessions → focus muscles (need to read free sessions in the month)
    //    We re-use the existing freeSessions list which only covers the
    //    current week. For days outside it we fall back to programmed only.
    //    (Free-session focus enrichment beyond the current week is a future
    //    iteration — most filtering value comes from programmed + external.)

    // 3) Programmed sessions: rotate program weeks across the month
    if (!program || totalWeeks === 0) return map;

    const created = new Date(program.created_at);
    const cDow = created.getDay();
    const cMonday = new Date(created);
    cMonday.setDate(cMonday.getDate() - cDow + (cDow === 0 ? -6 : 1));
    cMonday.setHours(0, 0, 0, 0);

    const monthStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const monthEnd = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0);
    const firstDow = monthStart.getDay();
    const monthGridStart = new Date(monthStart);
    monthGridStart.setDate(monthStart.getDate() - ((firstDow + 6) % 7));
    const cursor = new Date(monthGridStart);

    while (cursor <= monthEnd || cursor.getMonth() === displayMonth.getMonth()) {
      const diffWeeks = Math.round(
        (cursor.getTime() - cMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      if (diffWeeks >= 0) {
        const weekIdx = diffWeeks % totalWeeks;
        const wk = program.weeks[weekIdx];
        (wk?.sessions || []).forEach((s) => {
          const dayIdx = s.day_of_week - 1;
          const d = new Date(cursor);
          d.setDate(cursor.getDate() + dayIdx);
          if (d.getMonth() !== displayMonth.getMonth()) return;
          const key = formatLocalDate(d);
          const muscles = s.sections
            .flatMap((sec) => sec.exercises.map((e) => e.exercise?.muscle_group))
            .filter(Boolean) as string[];
          const focuses = computeFocusCategories(muscles);
          if (focuses.size === 0) return;
          const set = ensure(key);
          focuses.forEach((f) => set.add(f));
        });
      }
      cursor.setDate(cursor.getDate() + 7);
      if (cursor.getTime() > monthEnd.getTime() + 7 * 24 * 60 * 60 * 1000) break;
    }
    return map;
  }, [program, totalWeeks, displayMonth, monthSummaries]);

  /** Sorted, deduplicated list of types available for the current month. */
  const availableTypes = useMemo(() => {
    const set = new Set<CategoryKey>();
    monthCategoriesByDay.forEach((cats) => cats.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [monthCategoriesByDay]);

  /**
   * Apply the active filters on top of the raw markers map.
   * - activityFilter narrows which kinds of activity are visible
   * - typeFilter only keeps days whose programmed session matches the muscle group
   */
  const filteredMarkers = useMemo(() => {
    if (activityFilter === "all" && !typeFilter) return monthMarkers;
    const out = new Map<string, MonthDayMarkers>();
    monthMarkers.forEach((m, key) => {
      // Type filter: drop days whose programmed sessions don't include the type
      if (typeFilter) {
        const cats = monthCategoriesByDay.get(key);
        if (!cats || !cats.has(typeFilter)) return;
      }
      // Activity filter: keep only matching marker categories
      let next: MonthDayMarkers | null = null;
      switch (activityFilter) {
        case "all":
          next = m;
          break;
        case "programmed":
          if (m.hasSession && !m.isCompleted) next = { hasSession: true };
          break;
        case "completed":
          if (m.isCompleted) next = { hasSession: true, isCompleted: true };
          break;
        case "external":
          if (m.hasExternal) next = { hasExternal: true };
          break;
      }
      if (next) out.set(key, next);
    });
    return out;
  }, [monthMarkers, activityFilter, typeFilter, monthCategoriesByDay]);

  const handleSelectDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (swapMode && swapSourceDate !== null) {
      if (d.toDateString() === swapSourceDate.toDateString()) {
        setSwapMode(false);
        setSwapSourceDay(null);
        setSwapSourceDate(null);
        return;
      }
      const targetDayIndex = (d.getDay() + 6) % 7;
      setSelectedDate(d);
      setDisplayMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      setSwapTargetDay(targetDayIndex);
      setSwapTargetDate(d);
      setSwapModalOpen(true);
      return;
    }
    setSelectedDate(d);
    setDisplayMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handlePrevMonth = () => {
    setMonthNavDir('left');
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setMonthNavDir('right');
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1));
  };

  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    handleSelectDate(d);
  };
  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    handleSelectDate(d);
  };

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
      originalDate: swapSourceDate!,
      newDate: swapTargetDate!,
      reason: reason || undefined,
    });
    if (result) {
      toast.success(t('session:session_moved'));
    }
    setSwapMode(false);
    setSwapSourceDay(null);
    setSwapTargetDay(null);
    setSwapSourceDate(null);
    setSwapTargetDate(null);
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
    const { data, error } = await supabase.rpc("redeem_coach_invite_token", { _token: upper });
    const status = (data as any)?.status;
    if (error || !status || status === "invalid" || status === "expired" || status === "maxed") {
      toast.error(t('auth:token_invalid', "Code invalide ou expiré"));
      return;
    }
    if (status === "already_linked") {
      toast.info(t('auth:token_join_already'));
      return;
    }
    if (status === "success") {
      toast.success(t('auth:token_join_success'));
      window.location.reload();
    }
  };

  const weekLabel =
    weekOffset === 0 ? t('calendar:this_week')
      : weekOffset === -1 ? t('calendar:last_week')
      : weekOffset === 1 ? t('calendar:next_week')
      : t('calendar:week_offset', { offset: weekOffset });

  // Total sessions in the displayed week (including free sessions)
  const totalWeekSessions = programmedCount + freeSessions.length;

  // Self-guided athletes can append a new week to their program.
  // The new week becomes the next chronological week in the calendar.
  const isSelfGuided = !!program && program.coach_id === null;
  const handleAddWeek = async () => {
    if (!program || addingWeek) return;
    setAddingWeek(true);
    const nextNumber = (program.weeks?.length || 0) + 1;
    const { error } = await supabase
      .from("program_weeks")
      .insert({ program_id: program.id, week_number: nextNumber });
    if (error) {
      toast.error(t("common:error"));
      setAddingWeek(false);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["student-program", studentId] });
    toast.success(`Semaine ${nextNumber} ajoutée`);
    setAddingWeek(false);
  };

  const handleJumpToday = () => {
    handleSelectDate(today);
  };

  const hasProgram = !!program;
  // Athlete is in "compose" mode when no program is loaded.
  // Banner collapses once a free session exists somewhere in the week.
  const bannerCollapsedByDefault = freeSessions.length > 0;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto relative pb-32 md:pb-0">
      {refreshing && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
          <RefreshCw className="h-3 w-3 animate-spin" />
          {t('common:refreshing', 'Mise à jour…')}
        </div>
      )}

      {/* Sage — Header. Passive program indicator (S3/6) replaces the old carousel. */}
      <header className="px-4 pt-4 pb-3 flex items-center justify-between gap-3 border-b border-border">
        <div className="min-w-0 flex-1">
          {hasProgram ? (
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-subtle truncate">
              <span>{program!.name}</span>
              <span className="mx-1.5 text-muted-subtle/60">·</span>
              <span className="tabular-nums">S{selectedWeekIndex + 1}/{totalWeeks}</span>
            </p>
          ) : (
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-subtle truncate">
              {t('calendar:hello', { name: userName })}
            </p>
          )}
          <h1 className="text-lg font-bold tracking-tight text-foreground mt-0.5">
            {t('calendar:program_title', 'Calendrier')}
          </h1>
        </div>
        {isSelfGuided && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddWeek}
            disabled={addingWeek}
            className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={2} />
            Semaine
          </Button>
        )}
        {/* Always visible: add a free/extra session for the selected day */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSessionChooserDate(selectedDate);
            setSessionChooserOpen(true);
          }}
          className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          aria-label="Ajouter une séance"
        >
          <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={2} />
          Séance
        </Button>
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

      {/* Monthly grid — free navigation across days/months */}
      <MonthFilters
        activity={activityFilter}
        onActivityChange={setActivityFilter}
        availableTypes={availableTypes}
        selectedType={typeFilter}
        onTypeChange={setTypeFilter}
      />
      <div className="flex justify-end px-3 pt-1">
        <button
          type="button"
          onClick={() => setCalendarMode((m) => (m === "week" ? "month" : "week"))}
          className="text-[11px] text-muted-foreground underline hover:text-foreground transition-colors"
        >
          {calendarMode === "week" ? "Vue mois" : "Vue semaine"}
        </button>
      </div>
      {calendarMode === "week" ? (
        <WeekStrip
          monthAnchor={displayMonth}
          selectedDate={selectedDate}
          markers={filteredMarkers}
          onSelectDate={handleSelectDate}
          onPrevMonth={handlePrevWeek}
          onNextMonth={handleNextWeek}
          onJumpToday={handleJumpToday}
        />
      ) : (
        <MonthGrid
          monthAnchor={displayMonth}
          selectedDate={selectedDate}
          markers={filteredMarkers}
          onSelectDate={handleSelectDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onJumpToday={handleJumpToday}
          direction={monthNavDir}
          swapMode={swapMode}
        />
      )}

      <div className="mt-3">
        <RaceGoalCard
          raceGoal={raceGoal as any}
          weeklyKm={weeklyRunKm}
          onSetGoal={() => setRaceGoalSheetOpen(true)}
          onEditGoal={() => setRaceGoalSheetOpen(true)}
        />
      </div>

      {/* Selected day summary line */}
      <div className="px-4 pt-3 pb-2 flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate">
            {weekLabel} · {weekRangeLabel}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[22px] font-bold tabular-nums tracking-tight text-foreground leading-none">
              {completedSessionCount}
            </span>
            <span className="text-xs font-medium text-muted-subtle">
              / {totalWeekSessions} séances
            </span>
          </div>
        </div>
      </div>

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
            onClick={() => { setSwapMode(false); setSwapSourceDay(null); setSwapSourceDate(null); setSwapTargetDate(null); }}
            aria-label={t('common:cancel')}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      )}

      {/* Selected day detail (single ProgDayRow, kept for visual parity) */}
      <div className="border-y border-border">
        {(() => {
          const day = dates[selectedDayIndex];
          if (!day) return null;
          const isSessionDay = day.hasSession;
          const sessionInfo = effectiveSessions[day.dayIndex];
          const sessionCompleted = isSessionDay && !!sessionInfo && isSessionCompleted(sessionInfo.sessionId);
          const dayExternals = getExternalForDay(day.date);
          const dayFreeSessions = getFreeForDay(day.date);
          const isLast = true;

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
              navigate(getSessionRoute(sessionInfo.sessionId, sessionInfo.session_type));
            } else if (dayFreeSessions.length === 1) {
              navigate(getSessionRoute(dayFreeSessions[0].id, dayFreeSessions[0].session_type));
            } else if (dayFreeSessions.length > 1) {
              // Multi-session day — handled by stacked cards below; row click is a no-op
            } else if (!day.isPast) {
              setBuilderDate(day.date);
              setBuilderOpen(true);
            }
          };

          // Flattened list of all sessions for the day (used for multi-session stacked cards)
          const allDaySessions: Array<{
            id: string;
            name: string;
            meta: string;
            isCompleted: boolean;
            sessionType?: string;
          }> = [];
          if (isSessionDay && sessionInfo) {
            allDaySessions.push({
              id: sessionInfo.sessionId,
              name: sessionInfo.name,
              meta: [
                `${sessionInfo.exerciseCount} ex.`,
                ...(sessionInfo.muscleGroups.slice(0, 2)),
              ].join(' · '),
            isCompleted: sessionCompleted,
            sessionType: sessionInfo.session_type,
          });
          }
          dayFreeSessions.forEach(fs => {
            allDaySessions.push({
              id: fs.id,
              name: fs.name,
              meta: `${fs.exerciseCount} ex.`,
              isCompleted: isSessionCompleted(fs.id),
              sessionType: fs.session_type,
            });
          });
          const isMultiSession = allDaySessions.length > 1;

          // Pick what to show as session name/meta
          let sessionName: string | null = null;
          let sessionMeta: string | null = null;
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
          }
          // For multi-session days, the row stays compact (label + menu) and the
          // session details live in the stacked cards below.
          if (isMultiSession) {
            sessionName = null;
            sessionMeta = null;
          }

          // Action menu (kept feature parity with previous version)
          const hasMenu = !swapMode && (isSessionDay || !day.isPast);
          const actionMenu = hasMenu ? (
            <>
              <DropdownMenuItem onClick={() => { setSessionChooserDate(day.date); setSessionChooserOpen(true); }}>
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
                  <DropdownMenuItem onClick={() => { setSwapMode(true); setSwapSourceDay(day.dayIndex); setSwapSourceDate(dates[day.dayIndex].date); }}>
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
              {dayFreeSessions[0]
                && !isSessionCompleted(dayFreeSessions[0].id)
                && dayFreeSessions[0].session_type !== "running"
                && dayFreeSessions[0].session_type !== "hybrid" && (
                <DropdownMenuItem
                  onClick={() => navigate(`/student/session/${dayFreeSessions[0].id}/preview?edit=1`)}
                >
                  <Pencil className="w-4 h-4 mr-2" />{t('session:edit_session')}
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
              {isMultiSession ? (
                <div className="space-y-1.5 pb-1">
                  {allDaySessions.map((s) => {
                    const sessionIcon = s.sessionType === 'running'
                      ? <Activity className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                      : s.sessionType === 'hybrid'
                        ? <Zap className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                        : <Dumbbell className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(getSessionRoute(s.id, s.sessionType));
                        }}
                        className={cn(
                          "w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-md border transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          s.isCompleted
                            ? "bg-success-bg/40 border-success/20 text-muted-foreground"
                            : day.isToday
                              ? "bg-primary/5 border-primary/15 hover:bg-primary/10 active:bg-primary/15"
                              : "bg-bg-tinted border-border hover:bg-card active:bg-card"
                        )}
                      >
                        <span className={cn(
                          s.isCompleted ? "text-success" : day.isToday ? "text-primary" : "text-muted-foreground"
                        )}>
                          {s.isCompleted
                            ? <Check className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.5} />
                            : sessionIcon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "text-[13px] font-semibold truncate leading-tight",
                            s.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                          )}>
                            {s.name}
                          </p>
                          <p className="text-[10px] text-muted-subtle mt-0.5 truncate">{s.meta}</p>
                        </div>
                        {!s.isCompleted && (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-subtle flex-shrink-0" strokeWidth={2} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : isSessionDay && dayFreeSessions.length > 0 && (
                <div className="space-y-1 mt-1 pt-1 border-t border-border">
                  {dayFreeSessions.map(fs => (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(getSessionRoute(fs.id, fs.session_type));
                      }}
                      className="flex items-center justify-between w-full text-left py-1"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">{fs.name}</span>
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-subtle ml-2">
                        {fs.session_type === "running"
                          ? <span className="text-sky-600 dark:text-sky-400">Course</span>
                          : fs.session_type === "hybrid"
                          ? <span className="text-orange-600 dark:text-orange-400">Hybride</span>
                          : `${fs.exerciseCount} ex.`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          );

          // On rest days, expose the same action ("add a session") through both
          // the row click and the menu so creating a session on a week without
          // a program is intuitive.
          const restDayClickable = state === "rest" && !day.isPast;
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
              onClick={rowOnClick}
              actionMenu={actionMenu}
            >
              {(dayExternals.length > 0 || isMultiSession || (isSessionDay && dayFreeSessions.length > 0)) ? extras : null}
            </ProgDayRow>
          );
        })()}
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
          onClose={() => { setSwapModalOpen(false); setSwapMode(false); setSwapSourceDay(null); setSwapTargetDay(null); setSwapSourceDate(null); setSwapTargetDate(null); }}
          onConfirm={handleSwapConfirm}
          sessionName={effectiveSessions[swapSourceDay]?.name || "Session"}
          fromDayIndex={swapSourceDay}
          toDayIndex={swapTargetDay}
          fromDate={swapSourceDate ?? dates[swapSourceDay].date}
          toDate={swapTargetDate ?? dates[swapTargetDay].date}
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

      <SessionTypeChooser
        open={sessionChooserOpen}
        onClose={() => setSessionChooserOpen(false)}
        date={sessionChooserDate}
        onChooseStrength={(d) => {
          setSessionChooserOpen(false);
          setFreeSessionDate(d);
          setFreeSessionOpen(true);
        }}
        onChooseRun={(d) => {
          setSessionChooserOpen(false);
          setRunSessionDate(d);
          setRunSessionOpen(true);
        }}
        onChooseHybrid={(d) => {
          setSessionChooserOpen(false);
          setHybridDate(d);
          setHybridOpen(true);
        }}
      />

      <RunBlockEditor
        open={runSessionOpen}
        onClose={() => setRunSessionOpen(false)}
        date={runSessionDate}
        onSave={async (name, blocks) => {
          await supabase.from("sessions").insert([{
            name,
            day_of_week: runSessionDate.getDay() === 0 ? 7 : runSessionDate.getDay(),
            is_free_session: true,
            created_by: user!.id,
            free_session_date: formatLocalDate(runSessionDate),
            session_type: "running",
            run_blocks: blocks as unknown as never,
          }]);
          queryClient.invalidateQueries({ queryKey: ["week-free-sessions"] });
          queryClient.invalidateQueries({ queryKey: ["month-sessions"] });
        }}
      />

      <HybridSessionBuilder
        open={hybridOpen}
        onClose={() => setHybridOpen(false)}
        date={hybridDate}
        onSave={async (name, blocks) => {
          await supabase.from("sessions").insert([{
            name,
            day_of_week: hybridDate.getDay() === 0 ? 7 : hybridDate.getDay(),
            is_free_session: true,
            created_by: user!.id,
            free_session_date: formatLocalDate(hybridDate),
            session_type: "hybrid",
            hybrid_blocks: blocks as unknown as never,
          }]);
          queryClient.invalidateQueries({ queryKey: ["week-free-sessions"] });
          queryClient.invalidateQueries({ queryKey: ["month-sessions"] });
        }}
      />

      <Sheet open={multiSessionOpen} onOpenChange={(v) => !v && setMultiSessionOpen(false)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60dvh]">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-sm font-semibold">
              {multiSessionDate.toLocaleDateString("fr", {
                weekday: "long", day: "numeric", month: "long"
              })}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-4">
            {freeSessions
              .filter(fs => fs.date === formatLocalDate(multiSessionDate))
              .map(fs => (
                <button
                  key={fs.id}
                  onClick={() => {
                    setMultiSessionOpen(false);
                    navigate(
                      fs.session_type === "running"
                        ? `/student/run/${fs.id}`
                        : fs.session_type === "hybrid"
                        ? `/student/hybrid/${fs.id}`
                        : `/student/session/${fs.id}/preview`
                    );
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all text-left"
                >
                  <span className="text-xl">
                    {fs.session_type === "hybrid"
                      ? "🔥"
                      : fs.session_type === "running"
                      ? "🏃"
                      : "💪"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{fs.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fs.session_type === "running"
                        ? "Course à pied"
                        : fs.session_type === "hybrid"
                        ? "Hybride"
                        : `${fs.exerciseCount} exercices`}
                    </p>
                  </div>
                </button>
              ))}
            <button
              onClick={() => {
                setMultiSessionOpen(false);
                setSessionChooserDate(multiSessionDate);
                setSessionChooserOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all text-left"
            >
              <span className="text-xl">➕</span>
              <p className="font-semibold text-sm">Ajouter une séance</p>
            </button>
          </div>
        </SheetContent>
      </Sheet>

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

      {studentId && (
        <RaceGoalSetupSheet
          open={raceGoalSheetOpen}
          onClose={() => setRaceGoalSheetOpen(false)}
          existingGoal={raceGoal as any}
          studentId={studentId}
          onSaved={() => { setRaceGoalSheetOpen(false); refetchRaceGoal(); }}
        />
      )}
    </div>
  );
};

export default StudentWeek;
