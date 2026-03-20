import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCoachExercises } from "@/hooks/useCoachExercises";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

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

interface CreateExerciseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const CreateExerciseModal = ({ open, onClose, onCreated }: CreateExerciseModalProps) => {
  const { t } = useTranslation("exercises");
  const isMobile = useIsMobile();
  const { createExercise, isCreating, checkNameExists } = useCoachExercises();

  const [form, setForm] = useState({
    name: "",
    name_en: "",
    muscle_group: "",
    equipment: "",
    type: "compound",
    tracking_type: "weight_reps",
    description: "",
    secondary_muscle: "",
    public_cible: "mixte",
  });

  const resetForm = () => {
    setForm({
      name: "", name_en: "", muscle_group: "", equipment: "",
      type: "compound", tracking_type: "weight_reps", description: "",
      secondary_muscle: "", public_cible: "mixte",
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.muscle_group || !form.equipment) {
      toast.error(t("custom_fill_required"));
      return;
    }

    const exists = await checkNameExists(form.name.trim());
    if (exists) {
      toast.error(t("custom_name_exists"));
      return;
    }

    await createExercise({
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

    resetForm();
    onClose();
    onCreated?.();
  };

  const content = (
    <div className="space-y-4 pb-4">
      <div className="space-y-2">
        <Label>{t("custom_name")} *</Label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Hip thrust barre" />
      </div>
      <div className="space-y-2">
        <Label>{t("custom_name_en")}</Label>
        <Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} placeholder="Ex: Barbell Hip Thrust" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t("custom_muscle_group")} *</Label>
          <Select value={form.muscle_group} onValueChange={v => setForm(f => ({ ...f, muscle_group: v }))}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {MUSCLE_GROUPS_FR.map(mg => <SelectItem key={mg} value={mg}>{mg}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("custom_equipment")} *</Label>
          <Select value={form.equipment} onValueChange={v => setForm(f => ({ ...f, equipment: v }))}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {EQUIPMENT_FR.map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t("custom_type")}</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map(tp => <SelectItem key={tp} value={tp}>{t(`type_${tp}`, tp)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("custom_tracking")}</Label>
          <Select value={form.tracking_type} onValueChange={v => setForm(f => ({ ...f, tracking_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRACKING_TYPES.map(tt => <SelectItem key={tt} value={tt}>{t(`tracking_${tt}`, tt)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("custom_secondary")}</Label>
        <Input value={form.secondary_muscle} onChange={e => setForm(f => ({ ...f, secondary_muscle: e.target.value }))} placeholder="Ex: Fessiers, Lombaires" />
      </div>
      <div className="space-y-2">
        <Label>{t("custom_public")}</Label>
        <Select value={form.public_cible} onValueChange={v => setForm(f => ({ ...f, public_cible: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PUBLIC_CIBLE.map(pc => <SelectItem key={pc} value={pc}>{t(`public_${pc}`, pc)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("custom_description")}</Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={isCreating}>
        {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {t("custom_create_btn")}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={o => !o && onClose()}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
          <SheetHeader><SheetTitle>{t("custom_create_title")}</SheetTitle></SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("custom_create_title")}</DialogTitle></DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default CreateExerciseModal;
