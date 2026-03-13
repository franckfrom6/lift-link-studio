import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatLocalDate } from "@/lib/date-utils";
import {
  LiveExercise, MuscleTarget, EquipmentOption,
  SessionBuilderState, TARGET_TO_MUSCLE_GROUPS, EQUIPMENT_TO_DB,
} from "@/types/session-builder";

const DRAFT_KEY = "session_builder_draft";

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useSessionBuilder() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation("session");

  const [state, setState] = useState<SessionBuilderState>(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try { return JSON.parse(draft); } catch {}
    }
    return {
      targetDuration: 45,
      targets: [],
      equipment: ["dumbbells", "barbell"],
      exercises: [],
      sessionName: "",
    };
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const draftIntervalRef = useRef<ReturnType<typeof setInterval>>();

  // Auto-draft every 30s
  useEffect(() => {
    draftIntervalRef.current = setInterval(() => {
      if (state.exercises.length > 0) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      }
    }, 30000);
    return () => clearInterval(draftIntervalRef.current);
  }, [state]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const setExercises = useCallback((exercises: LiveExercise[]) => {
    setState(prev => ({ ...prev, exercises }));
  }, []);

  const setSessionName = useCallback((name: string) => {
    setState(prev => ({ ...prev, sessionName: name }));
  }, []);

  const generateSession = useCallback(async (
    duration: number, targets: MuscleTarget[], equipment: EquipmentOption[]
  ) => {
    setLoading(true);
    setState(prev => ({ ...prev, targetDuration: duration, targets, equipment }));

    try {
      // Resolve muscle groups from targets
      const muscleGroups = [...new Set(targets.flatMap(t => TARGET_TO_MUSCLE_GROUPS[t] || []))];
      const dbEquipment = [...new Set(equipment.map(e => EQUIPMENT_TO_DB[e]))];

      if (muscleGroups.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch matching exercises from DB
      let query = supabase
        .from("exercises")
        .select("id, name, name_en, muscle_group, equipment, type, tracking_type")
        .eq("is_default", true)
        .in("muscle_group", muscleGroups);

      if (dbEquipment.length > 0) {
        query = query.in("equipment", dbEquipment);
      }

      const { data: allExercises } = await query.order("type").order("name").limit(50);

      if (!allExercises || allExercises.length === 0) {
        toast.error(t("builder_no_exercises"));
        setLoading(false);
        return;
      }

      // Calculate target exercise count: ~4-5 min per set, including warmup
      const warmupTime = 5;
      const cooldownTime = 5;
      const availableTime = duration - warmupTime - cooldownTime;
      const avgTimePerExercise = 5; // avg minutes per exercise (including rest)
      const targetCount = Math.max(3, Math.min(10, Math.floor(availableTime / avgTimePerExercise)));

      // Prioritize compound exercises first, then isolation
      const compounds = allExercises.filter(e => e.type === "compound");
      const isolations = allExercises.filter(e => e.type !== "compound");

      // Select a balanced set
      const selected: typeof allExercises = [];
      const usedMuscles = new Set<string>();

      // Add compounds first (2/3 of exercises)
      const compoundTarget = Math.ceil(targetCount * 0.6);
      for (const ex of compounds) {
        if (selected.length >= compoundTarget) break;
        if (!selected.find(s => s.muscle_group === ex.muscle_group && s.equipment === ex.equipment)) {
          selected.push(ex);
          usedMuscles.add(ex.muscle_group);
        }
      }
      // Fill remaining from compounds if not enough variety
      for (const ex of compounds) {
        if (selected.length >= compoundTarget) break;
        if (!selected.find(s => s.id === ex.id)) {
          selected.push(ex);
        }
      }

      // Add isolations
      for (const ex of isolations) {
        if (selected.length >= targetCount) break;
        if (!selected.find(s => s.id === ex.id)) {
          selected.push(ex);
        }
      }

      // Build LiveExercise array
      const exercises: LiveExercise[] = selected.map((ex, i) => {
        const isCompound = ex.type === "compound";
        const useSupersets = duration < 45 && i > 0 && i % 2 === 1;
        return {
          id: generateId(),
          exerciseId: ex.id,
          name: ex.name,
          nameEn: ex.name_en,
          muscleGroup: ex.muscle_group,
          equipment: ex.equipment,
          type: ex.type,
          trackingType: ex.tracking_type || "weight_reps",
          sets: isCompound ? 4 : 3,
          repsMin: isCompound ? 8 : 12,
          repsMax: isCompound ? 10 : 15,
          restSeconds: useSupersets ? 30 : (isCompound ? 90 : 60),
          weightEnabled: ex.equipment !== "Poids du corps",
          order: i,
        };
      });

      // Auto-generate session name
      const targetLabels = targets.map(tg => t(`builder_target_${tg}`));
      const autoName = targetLabels.join(" + ") + ` (${duration}')`;

      setState(prev => ({
        ...prev,
        targetDuration: duration,
        targets,
        equipment,
        exercises,
        sessionName: prev.sessionName || autoName,
      }));
    } catch (err) {
      console.error("Error generating session:", err);
      toast.error(t("builder_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const startEmpty = useCallback((
    duration: number, targets: MuscleTarget[], equipment: EquipmentOption[]
  ) => {
    const targetLabels = targets.map(tg => t(`builder_target_${tg}`));
    const autoName = targetLabels.join(" + ") + ` (${duration}')`;
    setState({
      targetDuration: duration,
      targets,
      equipment,
      exercises: [],
      sessionName: autoName,
    });
  }, [t]);

  const saveAndStart = useCallback(async (date: Date): Promise<string | null> => {
    if (!user || state.exercises.length === 0) return null;
    setSaving(true);

    try {
      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          name: state.sessionName || t("builder_default_name"),
          day_of_week: date.getDay() === 0 ? 7 : date.getDay(),
          is_free_session: true,
          created_by: user.id,
          free_session_date: formatLocalDate(date),
        })
        .select("id")
        .single();

      if (sessionError || !session) throw sessionError;

      // Create a default section
      const { data: section } = await supabase
        .from("session_sections")
        .insert({
          session_id: session.id,
          name: t("builder_workout_section"),
          sort_order: 0,
        })
        .select("id")
        .single();

      // Insert exercises
      const exerciseRows = state.exercises.map((ex, i) => ({
        session_id: session.id,
        section_id: section?.id ?? null,
        exercise_id: ex.exerciseId,
        sort_order: i,
        sets: ex.sets,
        reps_min: ex.repsMin,
        reps_max: ex.repsMax,
        rest_seconds: ex.restSeconds,
        suggested_weight: ex.weightEnabled ? (ex.weightKg ?? null) : null,
        tempo: ex.tempo ?? null,
        rpe_target: ex.rpeTarget ?? null,
        coach_notes: ex.note ?? null,
      }));

      const { error: exError } = await supabase.from("session_exercises").insert(exerciseRows);
      if (exError) throw exError;

      clearDraft();
      toast.success(t("builder_session_created"));
      return session.id;
    } catch (err) {
      console.error("Error saving session:", err);
      toast.error(t("builder_save_error"));
      return null;
    } finally {
      setSaving(false);
    }
  }, [user, state, t, clearDraft]);

  return {
    state,
    loading,
    saving,
    setExercises,
    setSessionName,
    generateSession,
    startEmpty,
    saveAndStart,
    clearDraft,
  };
}
