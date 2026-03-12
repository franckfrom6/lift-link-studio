import { useState, useCallback, useEffect, useMemo } from "react";
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
  const [externalSessions, setExternalSessions] = useState<ExternalSessionData[]>([]);
  const [freeSessions, setFreeSessions] = useState<FreeSession[]>([]);
  const [checkins, setCheckins] = useState<Record<string, CheckinData>>({});
  const [externalFormOpen, setExternalFormOpen] = useState(false);
  const [externalFormDate, setExternalFormDate] = useState<Date>(new Date());
  const [editingExternal, setEditingExternal] = useState<ExternalSessionData | null>(null);
  const [checkinFormOpen, setCheckinFormOpen] = useState(false);

  const weekKey = formatLocalDate(weekStart);

  const fetchFreeSessions = useCallback(async () => {
    if (!studentId) return;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const { data, error } = await supabase
      .from("sessions")
      .select("id, name, free_session_date, session_exercises(id)")
      .eq("is_free_session", true)
      .eq("created_by", studentId)
      .gte("free_session_date", formatLocalDate(weekStart))
      .lte("free_session_date", formatLocalDate(weekEnd));
    if (error) {
      console.error("Error fetching free sessions:", error);
      return;
    }
    if (data) {
      setFreeSessions(data.map((s: any) => ({
        id: s.id,
        name: s.name,
        date: s.free_session_date,
        exerciseCount: s.session_exercises?.length || 0,
      })));
    }
  }, [studentId, weekStart]);

  const fetchExternalSessions = useCallback(async () => {
    if (!studentId) return;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const { data, error } = await supabase
      .from("external_sessions")
      .select("*")
      .eq("student_id", studentId)
      .gte("date", formatLocalDate(weekStart))
      .lte("date", formatLocalDate(weekEnd))
      .order("date");
    if (error) {
      console.error("Error fetching external sessions:", error);
      return;
    }
    if (data) {
      setExternalSessions(data.map((e: any) => ({
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
      })));
    }
  }, [studentId, weekStart]);

  const fetchCheckin = useCallback(async () => {
    if (!studentId) return;
    const { data, error } = await supabase
      .from("weekly_checkins")
      .select("*")
      .eq("student_id", studentId)
      .eq("week_start", formatLocalDate(weekStart))
      .maybeSingle();
    if (error) {
      console.error("Error fetching checkin:", error);
      return;
    }
    if (data) {
      setCheckins(prev => ({ ...prev, [formatLocalDate(weekStart)]: data as CheckinData }));
    }
  }, [studentId, weekStart]);

  useEffect(() => { fetchFreeSessions(); }, [fetchFreeSessions]);
  useEffect(() => { fetchExternalSessions(); }, [fetchExternalSessions]);
  useEffect(() => { fetchCheckin(); }, [fetchCheckin]);

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
      setExternalSessions(prev => prev.map(s => s.id === data.id ? data : s));
      toast.success(t("calendar:activity_modified"));
    } else {
      const { data: inserted, error } = await supabase.from("external_sessions").insert({
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
      }).select("id").single();
      if (error) {
        console.error("Error inserting external session:", error);
        toast.error(t("common:error"));
        return;
      }
      setExternalSessions(prev => [...prev, { ...data, id: inserted.id }]);
      toast.success(t("calendar:activity_added"));
    }
  };

  const handleDeleteExternal = async (id: string) => {
    const { error } = await supabase.from("external_sessions").delete().eq("id", id);
    if (error) {
      console.error("Error deleting external session:", error);
      toast.error(t("common:error"));
      return;
    }
    setExternalSessions(prev => prev.filter(s => s.id !== id));
    toast.success(t("calendar:activity_deleted"));
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
    setCheckins(prev => ({ ...prev, [weekKey]: data }));
    toast.success(t("checkin:checkin_sent"));
  };

  const currentCheckin = checkins[weekKey] || null;

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
