import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatLocalDate } from "@/lib/date-utils";
import { useTranslation } from "react-i18next";

export interface CheckinData {
  id?: string;
  energy_level: number;
  sleep_quality: number;
  stress_level: number;
  muscle_soreness: number;
  soreness_location: string[];
  availability_notes: string;
  general_notes: string;
  week_start: string;
}

interface WeeklyCheckinFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CheckinData) => void;
  weekStart: Date;
  initialData?: CheckinData | null;
}

interface EmojiSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  emojis: string[];
  lowLabel: string;
  highLabel: string;
}

const EmojiSlider = ({ label, value, onChange, emojis, lowLabel, highLabel }: EmojiSliderProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
        <span className="text-lg">{emojis[value - 1]}</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={cn(
              "flex-1 h-12 rounded-lg text-base font-bold transition-all border",
              value === level
                ? "border-primary bg-accent scale-105 shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/30"
            )}
          >
            {emojis[level - 1]}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
};

const WeeklyCheckinForm = ({ open, onClose, onSubmit, weekStart, initialData }: WeeklyCheckinFormProps) => {
  const { t, i18n } = useTranslation('checkin');
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [stress, setStress] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [sorenessLocations, setSorenessLocations] = useState<string[]>([]);
  const [availabilityNotes, setAvailabilityNotes] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  const SORENESS_LOCATIONS = [
    { id: "jambes", label: t('areas.legs') },
    { id: "dos", label: t('areas.back') },
    { id: "epaules", label: t('areas.shoulders') },
    { id: "bras", label: t('areas.arms') },
    { id: "core", label: t('areas.core') },
    { id: "haut-corps", label: t('areas.upper_body') },
  ];

  useEffect(() => {
    if (initialData) {
      setEnergy(initialData.energy_level);
      setSleep(initialData.sleep_quality);
      setStress(initialData.stress_level);
      setSoreness(initialData.muscle_soreness);
      setSorenessLocations(initialData.soreness_location);
      setAvailabilityNotes(initialData.availability_notes);
      setGeneralNotes(initialData.general_notes);
    } else {
      setEnergy(3);
      setSleep(3);
      setStress(3);
      setSoreness(2);
      setSorenessLocations([]);
      setAvailabilityNotes("");
      setGeneralNotes("");
    }
  }, [initialData, open]);

  const toggleLocation = (loc: string) => {
    setSorenessLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      id: initialData?.id,
      energy_level: energy,
      sleep_quality: sleep,
      stress_level: stress,
      muscle_soreness: soreness,
      soreness_location: sorenessLocations,
      availability_notes: availabilityNotes,
      general_notes: generalNotes,
      week_start: weekStart.toISOString().split("T")[0],
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-base">{t('weekly_checkin')}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            {t('week_of', { date: weekStart.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: "numeric", month: "long" }) })}
          </p>
        </SheetHeader>

        <div className="space-y-5 mt-4 pb-4">
          <EmojiSlider label={t('energy')} value={energy} onChange={setEnergy} emojis={["😴", "😪", "😐", "🔋", "⚡"]} lowLabel={t('energy_low')} highLabel={t('energy_high')} />
          <EmojiSlider label={t('sleep')} value={sleep} onChange={setSleep} emojis={["😵", "😣", "😐", "😊", "😴💤"]} lowLabel={t('sleep_low')} highLabel={t('sleep_high')} />
          <EmojiSlider label={t('stress')} value={stress} onChange={setStress} emojis={["😌", "😐", "😰", "😫", "🤯"]} lowLabel={t('stress_low')} highLabel={t('stress_high')} />
          <EmojiSlider label={t('soreness')} value={soreness} onChange={setSoreness} emojis={["💪", "😐", "😣", "😖", "🦽"]} lowLabel={t('soreness_low')} highLabel={t('soreness_high')} />

          {soreness >= 3 && (
            <div className="space-y-2 animate-fade-in">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('sore_areas')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {SORENESS_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => toggleLocation(loc.id)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
                      sorenessLocations.includes(loc.id)
                        ? "border-destructive/50 bg-destructive/10 text-destructive"
                        : "border-border text-muted-foreground hover:border-destructive/30"
                    )}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('availability')}</Label>
            <Textarea value={availabilityNotes} onChange={(e) => setAvailabilityNotes(e.target.value)} placeholder={t('availability_placeholder')} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('notes_for_coach')}</Label>
            <Textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} placeholder={t('notes_placeholder')} rows={2} />
          </div>

          <Button className="w-full h-12 font-semibold" onClick={handleSubmit}>
            {initialData ? t('edit_checkin') : t('send_checkin')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WeeklyCheckinForm;