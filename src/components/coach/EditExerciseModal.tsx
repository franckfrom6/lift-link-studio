import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useCoachExercises } from "@/hooks/useCoachExercises";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Exercise } from "@/types/exercise";

const MUSCLE_GROUPS_FR = [
  "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Jambes",
  "Fessiers", "Abdominaux", "Mollets", "Avant-bras", "Trapèzes", "Full Body",
];
const EQUIPMENT_FR = [
  "Barre", "Haltères", "Machine", "Câbles", "Poids de corps", "Kettlebell",
  "Élastique", "TRX", "Medecine Ball", "Smith Machine", "Banc", "Aucun",
];
const TYPES = ["compound", "isolation", "warmup", "stretching", "cardio"];
const TRACKING_TYPES = ["weight_reps", "reps_only", "duration", "distance"];
const PUBLIC_CIBLE = ["mixte", "homme", "femme"];

interface EditExerciseModalProps {
  open: boolean;
  onClose: () => void;
  exercise: Exercise | null;
}

const EditExerciseModal = ({ open, onClose, exercise }: EditExerciseModalProps) => {
  const { t } = useTranslation("exercises");
  const isMobile = useIsMobile();
  const { updateExercise, deleteExercise, isUpdating, isDeleting, checkNameExists } = useCoachExercises();

  const [form, setForm] = useState({
    name: "", name_en: "", muscle_group: "", equipment: "",
    type: "compound", tracking_type: "weight_reps", description: "",
    secondary_muscle: "", public_cible: "mixte",
  });

  useEffect(() => {
    if (exercise) {
      setForm({
        name: exercise.name,
        name_en: exercise.name_en || "",
        muscle_group: exercise.muscle_group,
        equipment: exercise.equipment,
        type: exercise.type,
        tracking_type: exercise.tracking_type || "weight_reps",
        description: exercise.description || "",
        secondary_muscle: exercise.secondary_muscle || "",
        public_cible: exercise.public_cible || "mixte",
      });
    }
  }, [exercise]);

  const handleSave = async () => {
    if (!exercise || !form.name.trim() || !form.muscle_group || !form.equipment) {
      toast.error(t("custom_fill_required"));
      return;
    }
    if (form.name.trim() !== exercise.name) {
      const exists = await checkNameExists(form.name.trim(), exercise.id);
      if (exists) { toast.error(t("custom_name_exists")); return; }
    }
    await updateExercise({
      id: exercise.id,
      name: form.name.trim(),
      name_en: form.name_en.trim() || null,
      muscle_group: form.muscle_group,
      equipment: form.equipment,
      type: form.type,
      tracking_type: form.tracking_type,
      description: form.description.trim() || null,
      secondary_muscle: form.secondary_muscle.trim() || null,
      public_cible: form.public_cible || null,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!exercise) return;
    await deleteExercise(exercise.id);
    onClose();
  };

  const content = (
    <div className="space-y-4 pb-4">
      <div className="space-y-2">
        <Label>{t("custom_name")} *</Label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>{t("custom_name_en")}</Label>
        <Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t("custom_muscle_group")} *</Label>
          <Select value={form.muscle_group} onValueChange={v => setForm(f => ({ ...f, muscle_group: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MUSCLE_GROUPS_FR.map(mg => <SelectItem key={mg} value={mg}>{mg}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("custom_equipment")} *</Label>
          <Select value={form.equipment} onValueChange={v => setForm(f => ({ ...f, equipment: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{EQUIPMENT_FR.map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t("custom_type")}</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map(tp => <SelectItem key={tp} value={tp}>{t(`type_${tp}`, tp)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("custom_tracking")}</Label>
          <Select value={form.tracking_type} onValueChange={v => setForm(f => ({ ...f, tracking_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TRACKING_TYPES.map(tt => <SelectItem key={tt} value={tt}>{t(`tracking_${tt}`, tt)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("custom_secondary")}</Label>
        <Input value={form.secondary_muscle} onChange={e => setForm(f => ({ ...f, secondary_muscle: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>{t("custom_public")}</Label>
        <Select value={form.public_cible} onValueChange={v => setForm(f => ({ ...f, public_cible: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{PUBLIC_CIBLE.map(pc => <SelectItem key={pc} value={pc}>{t(`public_${pc}`, pc)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("custom_description")}</Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleSave} disabled={isUpdating}>
          {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {t("custom_save_btn")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("custom_delete_title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("custom_delete_desc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common:cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t("custom_delete_confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={o => !o && onClose()}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
          <SheetHeader><SheetTitle>{t("custom_edit_title")}</SheetTitle></SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("custom_edit_title")}</DialogTitle></DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default EditExerciseModal;
