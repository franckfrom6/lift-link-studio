import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { LiveExercise } from "@/types/session-builder";
import { getExerciseName } from "@/lib/exercise-utils";

interface ExerciseEditSheetProps {
  exercise: LiveExercise | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updated: LiveExercise) => void;
  onDelete: () => void;
  onSubstitute: () => void;
}

const ExerciseEditSheet = ({ exercise, open, onClose, onUpdate, onDelete, onSubstitute }: ExerciseEditSheetProps) => {
  const { t } = useTranslation(["session", "exercises"]);
  const isAdvanced = useIsAdvanced();

  if (!exercise) return null;

  const update = (field: keyof LiveExercise, value: any) => {
    onUpdate({ ...exercise, [field]: value });
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base truncate">
            {getExerciseName({ name: exercise.name, name_en: exercise.nameEn })}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-4">
          {/* Sets & Reps */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">{t("exercises:sets_label")}</Label>
              <Input
                type="number" min={1} max={10}
                value={exercise.sets}
                onChange={e => update("sets", Number(e.target.value))}
                className="h-9 text-center"
              />
            </div>
            <div>
              <Label className="text-xs">{t("exercises:reps_min")}</Label>
              <Input
                type="number" min={1} max={50}
                value={exercise.repsMin}
                onChange={e => update("repsMin", Number(e.target.value))}
                className="h-9 text-center"
              />
            </div>
            <div>
              <Label className="text-xs">{t("exercises:reps_max")}</Label>
              <Input
                type="number" min={1} max={50}
                value={exercise.repsMax}
                onChange={e => update("repsMax", Number(e.target.value))}
                className="h-9 text-center"
              />
            </div>
          </div>

          {/* Rest */}
          <div>
            <Label className="text-xs">{t("exercises:rest_s")}</Label>
            <Input
              type="number" min={0} max={300} step={15}
              value={exercise.restSeconds}
              onChange={e => update("restSeconds", Number(e.target.value))}
              className="h-9 w-28"
            />
          </div>

          {/* Weight toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t("session:builder_weight_toggle")}</Label>
            <Switch
              checked={exercise.weightEnabled}
              onCheckedChange={v => update("weightEnabled", v)}
            />
          </div>
          {exercise.weightEnabled && (
            <div>
              <Label className="text-xs">{t("exercises:weight_kg")}</Label>
              <Input
                type="number" min={0} step={0.5}
                value={exercise.weightKg ?? ""}
                onChange={e => update("weightKg", e.target.value ? Number(e.target.value) : undefined)}
                className="h-9 w-28"
                placeholder="—"
              />
            </div>
          )}

          {/* Advanced fields */}
          {isAdvanced && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("exercises:tempo")}</Label>
                  <Input
                    value={exercise.tempo ?? ""}
                    onChange={e => update("tempo", e.target.value || undefined)}
                    className="h-9"
                    placeholder="3-1-2-0"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("exercises:rpe_target")}</Label>
                  <Input
                    value={exercise.rpeTarget ?? ""}
                    onChange={e => update("rpeTarget", e.target.value || undefined)}
                    className="h-9"
                    placeholder="7-8"
                  />
                </div>
              </div>
            </>
          )}

          {/* Note */}
          <div>
            <Label className="text-xs">{t("exercises:coach_notes")}</Label>
            <Textarea
              value={exercise.note ?? ""}
              onChange={e => update("note", e.target.value || undefined)}
              rows={2}
              className="text-sm"
              placeholder={t("session:builder_note_placeholder")}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onSubstitute}>
              {t("session:replace_exercise")}
            </Button>
            <Button variant="destructive" size="icon" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExerciseEditSheet;
