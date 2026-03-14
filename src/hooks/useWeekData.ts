import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ExternalSessionData } from "@/components/student/ExternalSessionForm";
import { CheckinData } from "@/components/student/WeeklyCheckinForm";
import { formatLocalDate } from "@/lib/date-utils";

interface FreeSession {
  id: string;
  name: string;
  date: string;
  exerciseCount: number;
}

export function useWeekData(studentId: string | null, weekStart: Date) {
  const { t } = useTranslation(["calendar", "common", "checkin"]);
  const queryClient = useQueryClient();
  const [externalFormOpen, setExternalFormOpen] = useState(false);
  const [externalFormDate, setExternalFormDate] = useState<Date>(new Date());
  const [editingExternal, setEditingExternal] = useState<ExternalSessionData | null>(null);
  const [checkinFormOpen, setCheckinFormOpen] = useState(false);

  const weekKey = formatLocalDate(weekStart);
  const weekEndDate = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);
  const weekEndKey = formatLocalDate(weekEndDate);

  // Free sessions query
  const { data: freeSessions = [] } = useQuery({
    queryKey: ['week-free-sessions', studentId, weekKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, name, free_session_date, session_exercises(id)")
        .eq("is_free_session", true)
        .eq("created_by", studentId!)
        .gte("free_session_date", weekKey)
        .lte("free_session_date", weekEndKey);
      if (error) { console.error("Error fetching free sessions:", error); return []; }
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        date: s.free_session_date,
        exerciseCount: s.session_exercises?.length || 0,
      })) as FreeSession[];
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  });

  // External sessions query
  const { data: externalSessions = [] } = useQuery({
    queryKey: ['week-external-sessions', studentId, weekKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_sessions")
        .select("*")
        .eq("student_id", studentId!)
        .gte("date", weekKey)
        .lte("date", weekEndKey)
        .order("date");
      if (error) { console.error("Error fetching external sessions:", error); return []; }
      return (data || []).map((e: any) => ({
        id: e.id,
        activity_type: e.activity_type,
        activity_label: e.activity_label || undefined,
        provider: e.provider || undefined,
        location: e.location || undefined,
        time_start: e.time_start || undefined,
        time_end: e.time_end || undefined,
        duration_minutes: e.duration_minutes || undefined,
        intensity_perceived: e.intensity_perceived || undefined,
        muscle_groups_involved: e.muscle_groups_involved || undefined,
        notes: e.notes || undefined,
        date: e.date,
      })) as ExternalSessionData[];
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  });

  // Checkin query
  const { data: currentCheckin = null } = useQuery({
    queryKey: ['week-checkin', studentId, weekKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_checkins")
        .select("*")
        .eq("student_id", studentId!)
        .eq("week_start", weekKey)
        .maybeSingle();
      if (error) { console.error("Error fetching checkin:", error); return null; }
      return (data as CheckinData) || null;
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  });

  const invalidateWeekData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['week-external-sessions', studentId, weekKey] });
    queryClient.invalidateQueries({ queryKey: ['week-free-sessions', studentId, weekKey] });
    queryClient.invalidateQueries({ queryKey: ['week-checkin', studentId, weekKey] });
  }, [queryClient, studentId, weekKey]);

  const handleExternalSubmit = async (data: ExternalSessionData) => {
    if (!studentId) return;
    if (data.id) {
      const { error } = await supabase.from("external_sessions").update({
        activity_type: data.activity_type,
        activity_label: data.activity_label || null,
        provider: data.provider || null,
        location: data.location || null,
        time_start: data.time_start || null,
        time_end: data.time_end || null,
        duration_minutes: data.duration_minutes || null,
        intensity_perceived: data.intensity_perceived || null,
        muscle_groups_involved: data.muscle_groups_involved || null,
        notes: data.notes || null,
        date: data.date,
      }).eq("id", data.id);
      if (error) {
        console.error("Error updating external session:", error);
        toast.error(t("common:error"));
        return;
      }
      toast.success(t("calendar:activity_modified"));
    } else {
      const { error } = await supabase.from("external_sessions").insert({
        student_id: studentId,
        activity_type: data.activity_type,
        activity_label: data.activity_label || null,
        provider: data.provider || null,
        location: data.location || null,
        time_start: data.time_start || null,
        time_end: data.time_end || null,
        duration_minutes: data.duration_minutes || null,
        intensity_perceived: data.intensity_perceived || null,
        muscle_groups_involved: data.muscle_groups_involved || null,
        notes: data.notes || null,
        date: data.date,
      });
      if (error) {
        console.error("Error inserting external session:", error);
        toast.error(t("common:error"));
        return;
      }
      toast.success(t("calendar:activity_added"));
    }
    invalidateWeekData();
  };

  const handleDeleteExternal = async (id: string) => {
    const { error } = await supabase.from("external_sessions").delete().eq("id", id);
    if (error) {
      console.error("Error deleting external session:", error);
      toast.error(t("common:error"));
      return;
    }
    toast.success(t("calendar:activity_deleted"));
    invalidateWeekData();
  };

  const handleCheckinSubmit = async (data: CheckinData) => {
    if (!studentId) return;
    const { error } = await supabase.from("weekly_checkins").upsert({
      student_id: studentId,
      week_start: formatLocalDate(weekStart),
      energy_level: data.energy_level,
      sleep_quality: data.sleep_quality,
      stress_level: data.stress_level,
      muscle_soreness: data.muscle_soreness,
      soreness_location: data.soreness_location || null,
      availability_notes: data.availability_notes || null,
      general_notes: data.general_notes || null,
    }, { onConflict: "student_id,week_start" });
    if (error) {
      console.error("Error saving checkin:", error);
      toast.error(t("common:error"));
      return;
    }
    toast.success(t("checkin:checkin_sent"));
    invalidateWeekData();
  };

  const weekExternals = useMemo(() => {
    return externalSessions.filter(s => {
      const d = new Date(s.date);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 7);
      return d >= weekStart && d < end;
    });
  }, [externalSessions, weekStart]);

  const handleAddExternal = (date: Date) => {
    setExternalFormDate(date);
    setEditingExternal(null);
    setExternalFormOpen(true);
  };

  const getFreeForDay = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return freeSessions.filter(s => s.date === dateStr);
  };

  const getExternalForDay = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return externalSessions.filter(s => s.date === dateStr);
  };

  return {
    externalSessions,
    freeSessions,
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
  };
}
