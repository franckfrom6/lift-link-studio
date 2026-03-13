import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Sparkles, PenLine, Dumbbell, Timer } from "lucide-react";
import {
  MuscleTarget, EquipmentOption,
  DURATION_PRESETS, PATTERN_TARGETS, ADVANCED_TARGETS, EQUIPMENT_OPTIONS,
} from "@/types/session-builder";

interface SessionBuilderParamsProps {
  onGenerate: (duration: number, targets: MuscleTarget[], equipment: EquipmentOption[]) => void;
  onStartEmpty: (duration: number, targets: MuscleTarget[], equipment: EquipmentOption[]) => void;
}

const SessionBuilderParams = ({ onGenerate, onStartEmpty }: SessionBuilderParamsProps) => {
  const { t } = useTranslation("session");
  const isAdvanced = useIsAdvanced();

  const [duration, setDuration] = useState(45);
  const [targets, setTargets] = useState<MuscleTarget[]>([]);
  const [equipment, setEquipment] = useState<EquipmentOption[]>(() => {
    const saved = localStorage.getItem("builder_equipment");
    return saved ? JSON.parse(saved) : ["dumbbells", "barbell"];
  });

  const toggleTarget = (t: MuscleTarget) => {
    setTargets(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const toggleEquipment = (e: EquipmentOption) => {
    setEquipment(prev => {
      const next = prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e];
      localStorage.setItem("builder_equipment", JSON.stringify(next));
      return next;
    });
  };

  const allTargets = isAdvanced ? [...PATTERN_TARGETS, ...ADVANCED_TARGETS] : PATTERN_TARGETS;
  const canProceed = targets.length > 0;

  return (
    <div className="flex-1 p-4 space-y-6 overflow-y-auto">
      {/* Duration */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <label className="text-sm font-semibold">{t("builder_duration")}</label>
          <span className="ml-auto text-sm font-bold text-primary">{duration} min</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                duration === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-accent"
              )}
            >
              {d}'
            </button>
          ))}
        </div>
        <Slider
          value={[duration]}
          onValueChange={([v]) => setDuration(v)}
          min={15}
          max={120}
          step={5}
          className="mt-1"
        />
      </div>

      {/* Targets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <label className="text-sm font-semibold">{t("builder_target")}</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTargets.map(tgt => (
            <button
              key={tgt}
              onClick={() => toggleTarget(tgt)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                targets.includes(tgt)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-accent"
              )}
            >
              {t(`builder_target_${tgt}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">{t("builder_equipment")}</label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map(eq => (
            <button
              key={eq}
              onClick={() => toggleEquipment(eq)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                equipment.includes(eq)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-accent"
              )}
            >
              {t(`builder_eq_${eq}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <Button
          className="w-full gap-2"
          disabled={!canProceed}
          onClick={() => onGenerate(duration, targets, equipment)}
        >
          <Sparkles className="w-4 h-4" />
          {t("builder_generate")}
        </Button>
        <Button
          variant="outline"
          className="w-full gap-2"
          disabled={!canProceed}
          onClick={() => onStartEmpty(duration, targets, equipment)}
        >
          <PenLine className="w-4 h-4" />
          {t("builder_from_scratch")}
        </Button>
      </div>
    </div>
  );
};

export default SessionBuilderParams;
