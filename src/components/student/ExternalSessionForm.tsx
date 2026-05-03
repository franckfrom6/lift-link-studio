import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatLocalDate } from "@/lib/date-utils";
import ActivityTypeSelector from "./ActivityTypeSelector";
import {
  ACTIVITY_TYPES, ActivityType, MUSCLE_GROUP_OPTIONS,
  DEFAULT_PROVIDERS, getIntensityColor, getActivityDiscipline,
} from "@/data/activity-types";
import { useTranslation } from "react-i18next";
import {
  EnduranceMetrics, ExternalSessionSource,
  computePaceSPerKm, formatPace,
} from "@/types/endurance";

export interface ExternalSessionData {
  id?: string;
  activity_type: string;
  activity_label: string;
  provider: string;
  location: string;
  time_start: string;
  time_end: string;
  duration_minutes: number;
  intensity_perceived: number;
  muscle_groups_involved: string[];
  notes: string;
  date: string;
  added_by?: "student" | "coach";
  // Endurance fields (all optional)
  distance_meters?: number | null;
  elevation_gain_m?: number | null;
  avg_heart_rate?: number | null;
  max_heart_rate?: number | null;
  calories?: number | null;
  avg_pace_s_per_km?: number | null;
  metrics?: EnduranceMetrics | null;
  source?: ExternalSessionSource | null;
  external_id?: string | null;
}

interface ExternalSessionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExternalSessionData) => void;
  date: Date;
  initialData?: ExternalSessionData | null;
  addedBy?: "student" | "coach";
}

const DURATION_OPTIONS = [30, 45, 60, 75, 90];

const ExternalSessionForm = ({ open, onClose, onSubmit, date, initialData, addedBy = "student" }: ExternalSessionFormProps) => {
  const { t, i18n } = useTranslation(['calendar', 'common']);
  const [activityType, setActivityType] = useState("pilates");
  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState(5);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [showProviderSuggestions, setShowProviderSuggestions] = useState(false);
  // Endurance fields
  const [distanceKm, setDistanceKm] = useState<string>("");
  const [elevationGain, setElevationGain] = useState<string>("");
  const [avgHr, setAvgHr] = useState<string>("");
  const [maxHr, setMaxHr] = useState<string>("");
  const [calories, setCalories] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setActivityType(initialData.activity_type);
      setLabel(initialData.activity_label);
      setProvider(initialData.provider);
      setLocation(initialData.location || "");
      setTimeStart(initialData.time_start || "");
      setTimeEnd(initialData.time_end || "");
      setDuration(initialData.duration_minutes);
      setIntensity(initialData.intensity_perceived);
      setMuscleGroups(initialData.muscle_groups_involved);
      setNotes(initialData.notes);
      setDistanceKm(initialData.distance_meters != null ? String(initialData.distance_meters / 1000) : "");
      setElevationGain(initialData.elevation_gain_m != null ? String(initialData.elevation_gain_m) : "");
      setAvgHr(initialData.avg_heart_rate != null ? String(initialData.avg_heart_rate) : "");
      setMaxHr(initialData.max_heart_rate != null ? String(initialData.max_heart_rate) : "");
      setCalories(initialData.calories != null ? String(initialData.calories) : "");
    } else {
      setActivityType("pilates");
      setLabel("");
      setProvider("");
      setLocation("");
      setTimeStart("");
      setTimeEnd("");
      setDuration(60);
      setIntensity(5);
      setMuscleGroups(ACTIVITY_TYPES[0].defaultMuscleGroups);
      setNotes("");
      setDistanceKm("");
      setElevationGain("");
      setAvgHr("");
      setMaxHr("");
      setCalories("");
    }
  }, [initialData, open]);

  const handleTypeChange = (type: ActivityType) => {
    setActivityType(type.id);
    setDuration(type.defaultDuration);
    // Endurance disciplines never carry muscle tags. Flexibility starts empty (optional).
    setMuscleGroups(
      type.discipline === "endurance" || type.discipline === "flexibility"
        ? []
        : type.defaultMuscleGroups
    );
    if (!label) setLabel(type.label);
  };

  const toggleMuscleGroup = (group: string) => {
    setMuscleGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  useEffect(() => {
    if (timeStart && timeEnd) {
      const [sh, sm] = timeStart.split(":").map(Number);
      const [eh, em] = timeEnd.split(":").map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) setDuration(diff);
    }
  }, [timeStart, timeEnd]);

  const handleSubmit = () => {
    const distance_meters = distanceKm ? Math.round(parseFloat(distanceKm) * 1000) : null;
    const isEndurance = discipline === "endurance";
    onSubmit({
      id: initialData?.id,
      activity_type: activityType,
      activity_label: label,
      provider,
      location,
      time_start: timeStart,
      time_end: timeEnd,
      duration_minutes: duration,
      intensity_perceived: intensity,
      muscle_groups_involved: muscleGroups,
      notes,
      date: formatLocalDate(date),
      added_by: initialData?.added_by || addedBy,
      distance_meters: isEndurance ? distance_meters : null,
      elevation_gain_m: isEndurance && elevationGain ? Math.round(parseFloat(elevationGain)) : null,
      avg_heart_rate: isEndurance && avgHr ? Math.round(parseFloat(avgHr)) : null,
      max_heart_rate: isEndurance && maxHr ? Math.round(parseFloat(maxHr)) : null,
      calories: isEndurance && calories ? Math.round(parseFloat(calories)) : null,
      avg_pace_s_per_km: isEndurance ? computePaceSPerKm(duration, distance_meters) : null,
    });
    onClose();
  };

  const intensityLabel = intensity <= 3 ? t('calendar:intensity_light') : intensity <= 6 ? t('calendar:intensity_moderate') : intensity <= 8 ? t('calendar:intensity_intense') : t('calendar:intensity_max');
  const discipline = getActivityDiscipline(activityType);
  const showMuscleSelector = discipline !== "endurance";
  const showEnduranceMetrics = discipline === "endurance";
  const livePace = showEnduranceMetrics
    ? formatPace(computePaceSPerKm(duration, distanceKm ? parseFloat(distanceKm) * 1000 : null))
    : "—";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[90dvh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-base">
            {initialData ? t('calendar:edit_activity') : t('calendar:add_activity')}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: "long", day: "numeric", month: "long" })}
            {addedBy === "coach" && (
              <span className="ml-1 text-primary font-medium">· {t('calendar:added_by_coach')}</span>
            )}
          </p>
        </SheetHeader>

        <div className="space-y-5 mt-4 pb-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('calendar:activity_type')}</Label>
            <ActivityTypeSelector value={activityType} onChange={handleTypeChange} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('calendar:name_optional')}</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('calendar:name_placeholder')} className="h-10" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('calendar:time_range')}</Label>
            <div className="flex items-center gap-2">
              <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className="h-10 flex-1" />
              <span className="text-muted-foreground text-sm">→</span>
              <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="h-10 flex-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('calendar:provider_label')}</Label>
              <Input value={provider} onChange={(e) => setProvider(e.target.value)} onFocus={() => setShowProviderSuggestions(true)} onBlur={() => setTimeout(() => setShowProviderSuggestions(false), 200)} placeholder={t('calendar:provider_placeholder')} className="h-10" />
              {showProviderSuggestions && !provider && (
                <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg p-1.5 space-y-0.5">
                  {DEFAULT_PROVIDERS.map((p) => (
                    <button key={p} type="button" onMouseDown={() => { setProvider(p); setShowProviderSuggestions(false); }} className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors">{p}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('calendar:location_label')}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('calendar:location_placeholder')} className="h-10" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('calendar:duration_label')}</Label>
              {timeStart && timeEnd && (
                <span className="text-[10px] text-muted-foreground">{t('calendar:auto_calculated')}</span>
              )}
            </div>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button key={d} type="button" onClick={() => setDuration(d)} className={cn("flex-1 py-2 rounded-lg text-sm font-medium border transition-all", duration === d ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground hover:border-primary/30")}>{d}'</button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('calendar:perceived_intensity')}</Label>
              <span className={cn("text-sm font-bold", getIntensityColor(intensity))}>
                {intensity}/10 · {intensityLabel}
              </span>
            </div>
            <Slider value={[intensity]} onValueChange={([v]) => setIntensity(v)} min={1} max={10} step={1} className="w-full" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{t('calendar:intensity_light')}</span>
              <span>{t('calendar:intensity_moderate')}</span>
              <span>{t('calendar:intensity_intense')}</span>
              <span>{t('calendar:intensity_max')}</span>
            </div>
          </div>

          {showEnduranceMetrics && (
            <div className="space-y-3 p-3 rounded-lg border border-dashed border-border bg-secondary/30">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('calendar:endurance_metrics', 'Métriques de la séance')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{t('calendar:distance_km', 'Distance (km)')}</Label>
                  <Input
                    inputMode="decimal"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value.replace(',', '.'))}
                    placeholder="ex: 8.5"
                    className="h-10 tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{t('calendar:elevation_m', 'D+ (m)')}</Label>
                  <Input
                    inputMode="numeric"
                    value={elevationGain}
                    onChange={(e) => setElevationGain(e.target.value)}
                    placeholder="ex: 120"
                    className="h-10 tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{t('calendar:avg_hr', 'FC moy (bpm)')}</Label>
                  <Input
                    inputMode="numeric"
                    value={avgHr}
                    onChange={(e) => setAvgHr(e.target.value)}
                    placeholder="ex: 148"
                    className="h-10 tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{t('calendar:max_hr', 'FC max (bpm)')}</Label>
                  <Input
                    inputMode="numeric"
                    value={maxHr}
                    onChange={(e) => setMaxHr(e.target.value)}
                    placeholder="ex: 178"
                    className="h-10 tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{t('calendar:calories_kcal', 'Calories (kcal)')}</Label>
                  <Input
                    inputMode="numeric"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="auto"
                    className="h-10 tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{t('calendar:avg_pace', 'Allure moy.')}</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted/40 text-sm tabular-nums text-foreground/80">
                    {livePace}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showMuscleSelector && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('calendar:muscles_involved')}
                {discipline === "flexibility" && (
                  <span className="ml-1 text-[10px] text-muted-foreground/70 normal-case font-normal">({t('common:optional', 'optionnel')})</span>
                )}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_GROUP_OPTIONS.map((group) => (
                  <button key={group} type="button" onClick={() => toggleMuscleGroup(group)} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all", muscleGroups.includes(group) ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground hover:border-primary/30")}>
                    {t(`calendar:muscle_groups.${group}`, group)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('calendar:notes_optional')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('calendar:notes_placeholder')} rows={2} />
          </div>

          <Button className="w-full h-12 font-semibold" onClick={handleSubmit}>
            {initialData ? t('calendar:submit_activity_edit') : t('calendar:submit_activity')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExternalSessionForm;