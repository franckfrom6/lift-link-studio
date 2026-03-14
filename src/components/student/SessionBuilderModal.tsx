import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Play, Save, BookmarkPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import SessionBuilderParams from "./SessionBuilderParams";
import LiveExerciseList from "./LiveExerciseList";
import ExercisePicker from "@/components/coach/ExercisePicker";
import { useSessionBuilder } from "@/hooks/useSessionBuilder";
import { MuscleTarget, EquipmentOption } from "@/types/session-builder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SessionBuilderModalProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  onCreated?: () => void;
}

const DRAFT_KEY = "session_builder_draft";

const SessionBuilderModal = ({ open, onClose, date, onCreated }: SessionBuilderModalProps) => {
  const { t } = useTranslation("session");
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    state, loading, saving,
    setExercises, setSessionName,
    generateSession, startEmpty, saveAndStart, clearDraft,
  } = useSessionBuilder();

  const [step, setStep] = useState<"resume" | "params" | "edit">("params");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [substituteTargetId, setSubstituteTargetId] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Check for draft on open
  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.exercises?.length > 0) {
            setStep("resume");
            return;
          }
        } catch {}
      }
      setStep("params");
    }
  }, [open]);

  const handleResumeDraft = () => {
    setStep("edit");
  };

  const handleNewSession = () => {
    clearDraft();
    setStep("params");
  };

  const handleGenerate = async (duration: number, targets: MuscleTarget[], equipment: EquipmentOption[]) => {
    await generateSession(duration, targets, equipment);
    setStep("edit");
  };

  const handleStartEmpty = (duration: number, targets: MuscleTarget[], equipment: EquipmentOption[]) => {
    startEmpty(duration, targets, equipment);
    setStep("edit");
  };

  const handleStartSession = async () => {
    const sessionId = await saveAndStart(date);
    if (sessionId) {
      onCreated?.();
      onClose();
      navigate(`/student/session/${sessionId}`);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!user || state.exercises.length === 0) return;
    setSavingTemplate(true);
    try {
      // Create a program with the session as a template
      const { data: program, error: progError } = await supabase
        .from("programs")
        .insert({
          name: state.sessionName || t("builder_default_name"),
          student_id: user.id,
          status: "active",
          is_ai_generated: false,
        })
        .select("id")
        .single();
      if (progError || !program) throw progError;

      const { data: week } = await supabase
        .from("program_weeks")
        .insert({ program_id: program.id, week_number: 1 })
        .select("id")
        .single();

      const { data: session } = await supabase
        .from("sessions")
        .insert({
          name: state.sessionName || t("builder_default_name"),
          day_of_week: 1,
          week_id: week?.id,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (session) {
        const { data: section } = await supabase
          .from("session_sections")
          .insert({ session_id: session.id, name: t("builder_workout_section"), sort_order: 0 })
          .select("id")
          .single();

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
        await supabase.from("session_exercises").insert(exerciseRows);
      }

      clearDraft();
      toast.success(t("builder_template_saved"));
      onClose();
    } catch (err) {
      console.error("Error saving template:", err);
      toast.error(t("builder_save_error"));
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleAddExercise = () => {
    setSubstituteTargetId(null);
    setPickerOpen(true);
  };

  const handleSubstitute = (exerciseLocalId: string) => {
    setSubstituteTargetId(exerciseLocalId);
    setPickerOpen(true);
  };

  const handleExercisePicked = (exercise: any) => {
    if (substituteTargetId) {
      setExercises(state.exercises.map(ex => {
        if (ex.id !== substituteTargetId) return ex;
        return {
          ...ex,
          exerciseId: exercise.id,
          name: exercise.name,
          nameEn: exercise.name_en,
          muscleGroup: exercise.muscle_group,
          equipment: exercise.equipment,
          type: exercise.type,
          trackingType: exercise.tracking_type || "weight_reps",
          weightEnabled: exercise.equipment !== "bodyweight" && exercise.equipment !== "Poids du corps",
        };
      }));
      setSubstituteTargetId(null);
    } else {
      const isCompound = exercise.type === "compound";
      setExercises([
        ...state.exercises,
        {
          id: crypto.randomUUID?.() ?? `${Date.now()}`,
          exerciseId: exercise.id,
          name: exercise.name,
          nameEn: exercise.name_en,
          muscleGroup: exercise.muscle_group,
          equipment: exercise.equipment,
          type: exercise.type,
          trackingType: exercise.tracking_type || "weight_reps",
          sets: isCompound ? 4 : 3,
          repsMin: isCompound ? 8 : 12,
          repsMax: isCompound ? 10 : 15,
          restSeconds: isCompound ? 90 : 60,
          weightEnabled: exercise.equipment !== "bodyweight" && exercise.equipment !== "Poids du corps",
          order: state.exercises.length,
        },
      ]);
    }
  };

  const handleClose = () => {
    setStep("params");
    onClose();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && handleClose()}>
        <SheetContent side="bottom" className="h-[92vh] flex flex-col p-0">
          <SheetHeader className="p-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              {step === "edit" && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setStep("params")}>
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              )}
              <SheetTitle className="text-base truncate">
                {step === "resume" ? t("builder_title") : step === "params" ? t("builder_title") : (
                  <Input
                    value={state.sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    className="h-7 bg-transparent border-none p-0 font-semibold text-base focus-visible:ring-0"
                    placeholder={t("builder_name_placeholder")}
                  />
                )}
              </SheetTitle>
            </div>
          </SheetHeader>

          {step === "resume" ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
              <div className="text-center space-y-2">
                <Save className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
                <h3 className="font-bold text-lg">{t("builder_draft_found")}</h3>
                <p className="text-sm text-muted-foreground">{t("builder_draft_desc")}</p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                <Button className="w-full" onClick={handleResumeDraft}>
                  {t("builder_draft_resume")}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleNewSession}>
                  {t("builder_draft_new")}
                </Button>
              </div>
            </div>
          ) : step === "params" ? (
            loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <SessionBuilderParams
                onGenerate={handleGenerate}
                onStartEmpty={handleStartEmpty}
              />
            )
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <LiveExerciseList
                    exercises={state.exercises}
                    onChange={setExercises}
                    onAddExercise={handleAddExercise}
                    onSubstitute={handleSubstitute}
                  />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border shrink-0 space-y-2">
                <Button
                  className="w-full gap-2"
                  onClick={handleStartSession}
                  disabled={state.exercises.length === 0 || saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {t("builder_start_session")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleSaveAsTemplate}
                  disabled={state.exercises.length === 0 || savingTemplate}
                >
                  {savingTemplate ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BookmarkPlus className="w-4 h-4" />
                  )}
                  {t("builder_save_template")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleExercisePicked}
        excludeIds={state.exercises.map(e => e.exerciseId)}
      />
    </>
  );
};

export default SessionBuilderModal;
