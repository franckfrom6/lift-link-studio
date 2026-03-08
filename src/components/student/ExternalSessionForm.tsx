import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import ActivityTypeSelector from "./ActivityTypeSelector";
import {
  ACTIVITY_TYPES, ActivityType, MUSCLE_GROUP_OPTIONS, MUSCLE_GROUP_LABELS,
  DEFAULT_PROVIDERS, getIntensityColor,
} from "@/data/activity-types";

export interface ExternalSessionData {
  id?: string;
  activity_type: string;
  activity_label: string;
  provider: string;
  duration_minutes: number;
  intensity_perceived: number;
  muscle_groups_involved: string[];
  notes: string;
  date: string;
}

interface ExternalSessionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExternalSessionData) => void;
  date: Date;
  initialData?: ExternalSessionData | null;
}

const DURATION_OPTIONS = [30, 45, 60, 75, 90];

const ExternalSessionForm = ({ open, onClose, onSubmit, date, initialData }: ExternalSessionFormProps) => {
  const [activityType, setActivityType] = useState("pilates");
  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState("");
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState(5);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [showProviderSuggestions, setShowProviderSuggestions] = useState(false);

  useEffect(() => {
    if (initialData) {
      setActivityType(initialData.activity_type);
      setLabel(initialData.activity_label);
      setProvider(initialData.provider);
      setDuration(initialData.duration_minutes);
      setIntensity(initialData.intensity_perceived);
      setMuscleGroups(initialData.muscle_groups_involved);
      setNotes(initialData.notes);
    } else {
      setActivityType("pilates");
      setLabel("");
      setProvider("");
      setDuration(60);
      setIntensity(5);
      setMuscleGroups(ACTIVITY_TYPES[0].defaultMuscleGroups);
      setNotes("");
    }
  }, [initialData, open]);

  const handleTypeChange = (type: ActivityType) => {
    setActivityType(type.id);
    setDuration(type.defaultDuration);
    setMuscleGroups(type.defaultMuscleGroups);
    if (!label) setLabel(type.label);
  };

  const toggleMuscleGroup = (group: string) => {
    setMuscleGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      id: initialData?.id,
      activity_type: activityType,
      activity_label: label,
      provider,
      duration_minutes: duration,
      intensity_perceived: intensity,
      muscle_groups_involved: muscleGroups,
      notes,
      date: date.toISOString().split("T")[0],
    });
    onClose();
  };

  const intensityLabel = intensity <= 3 ? "Light" : intensity <= 6 ? "Modéré" : intensity <= 8 ? "Intense" : "Max";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-base">
            {initialData ? "Modifier l'activité" : "Ajouter une activité"}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </SheetHeader>

        <div className="space-y-5 mt-4 pb-4">
          {/* Activity type */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type d'activité</Label>
            <ActivityTypeSelector value={activityType} onChange={handleTypeChange} />
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nom (optionnel)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: RPM 45min, Bootcamp Athletic"
              className="h-10"
            />
          </div>

          {/* Provider */}
          <div className="space-y-1.5 relative">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enseigne / Studio</Label>
            <Input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              onFocus={() => setShowProviderSuggestions(true)}
              onBlur={() => setTimeout(() => setShowProviderSuggestions(false), 200)}
              placeholder="Ex: Episod, CMG..."
              className="h-10"
            />
            {showProviderSuggestions && !provider && (
              <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg p-1.5 space-y-0.5">
                {DEFAULT_PROVIDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onMouseDown={() => { setProvider(p); setShowProviderSuggestions(false); }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Durée</Label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                    duration === d
                      ? "border-primary bg-accent text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {d}'
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intensité perçue</Label>
              <span className={cn("text-sm font-bold", getIntensityColor(intensity))}>
                {intensity}/10 · {intensityLabel}
              </span>
            </div>
            <Slider
              value={[intensity]}
              onValueChange={([v]) => setIntensity(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Light</span>
              <span>Modéré</span>
              <span>Intense</span>
              <span>Max</span>
            </div>
          </div>

          {/* Muscle groups */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Muscles sollicités</Label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUP_OPTIONS.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => toggleMuscleGroup(group)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                    muscleGroups.includes(group)
                      ? "border-primary bg-accent text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {MUSCLE_GROUP_LABELS[group] || group}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Beaucoup de squats aujourd'hui"
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button className="w-full h-12 font-semibold" onClick={handleSubmit}>
            {initialData ? "Modifier" : "Ajouter l'activité"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExternalSessionForm;
