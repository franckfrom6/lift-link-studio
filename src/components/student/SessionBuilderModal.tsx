import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Play, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import SessionBuilderParams from "./SessionBuilderParams";
import LiveExerciseList from "./LiveExerciseList";
import ExercisePicker from "@/components/coach/ExercisePicker";
import { useSessionBuilder } from "@/hooks/useSessionBuilder";
import { MuscleTarget, EquipmentOption, EQUIPMENT_TO_DB, TARGET_TO_MUSCLE_GROUPS } from "@/types/session-builder";

interface SessionBuilderModalProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  onCreated?: () => void;
}

const SessionBuilderModal = ({ open, onClose, date, onCreated }: SessionBuilderModalProps) => {
  const { t } = useTranslation("session");
  const navigate = useNavigate();
  const {
    state, loading, saving,
    setExercises, setSessionName,
    generateSession, startEmpty, saveAndStart, clearDraft,
  } = useSessionBuilder();

  const [step, setStep] = useState<"params" | "edit">("params");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [substituteTargetId, setSubstituteTargetId] = useState<string | null>(null);

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
      // Replace
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
          weightEnabled: exercise.equipment !== "Poids du corps",
        };
      }));
      setSubstituteTargetId(null);
    } else {
      // Add new
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
          weightEnabled: exercise.equipment !== "Poids du corps",
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
                {step === "params" ? t("builder_title") : (
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

          {step === "params" ? (
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
