import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RACE_TYPE_LABELS } from "@/types/running";
import { formatLocalDate } from "@/lib/date-utils";

interface RaceGoalSetupSheetProps {
  open: boolean;
  onClose: () => void;
  existingGoal?: {
    id: string;
    race_type: string;
    target_date: string;
    target_time_min?: number | null;
    current_weekly_km?: number | null;
    current_easy_pace_s_per_km?: number | null;
    notes?: string | null;
  } | null;
  studentId: string;
  onSaved: () => void;
}

const RACE_TYPES: string[] = ["5k", "10k", "half_marathon", "marathon", "trail_20k", "trail_50k"];

function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 28);
  return formatLocalDate(d);
}

function parseHMS(s: string): number | null {
  if (!s) return null;
  const parts = s.split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  let h = 0, m = 0;
  if (parts.length === 3) { h = parts[0]; m = parts[1]; }
  else if (parts.length === 2) { h = parts[0]; m = parts[1]; }
  else return null;
  return h * 60 + m;
}

function formatHMS(min?: number | null): string {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
}

function parseMSS(s: string): number | null {
  if (!s) return null;
  const parts = s.split(":").map((p) => parseInt(p, 10));
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  return parts[0] * 60 + parts[1];
}

function formatMSS(sec?: number | null): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const RaceGoalSetupSheet = ({ open, onClose, existingGoal, studentId, onSaved }: RaceGoalSetupSheetProps) => {
  const [raceType, setRaceType] = useState<string>("10k");
  const [targetDate, setTargetDate] = useState<string>("");
  const [timeInput, setTimeInput] = useState<string>("");
  const [weeklyKm, setWeeklyKm] = useState<number>(20);
  const [paceInput, setPaceInput] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existingGoal) {
      setRaceType(existingGoal.race_type);
      setTargetDate(existingGoal.target_date);
      setTimeInput(formatHMS(existingGoal.target_time_min));
      setWeeklyKm(existingGoal.current_weekly_km || 20);
      setPaceInput(formatMSS(existingGoal.current_easy_pace_s_per_km));
      setNotes(existingGoal.notes || "");
    } else {
      setRaceType("10k");
      setTargetDate("");
      setTimeInput("");
      setWeeklyKm(20);
      setPaceInput("");
      setNotes("");
    }
  }, [open, existingGoal]);

  const handleSave = async () => {
    if (!targetDate) {
      toast.error("Choisis une date de course");
      return;
    }
    setSaving(true);
    try {
      const parsedMinutes = parseHMS(timeInput);
      const parsedPaceSec = parseMSS(paceInput);

      await supabase
        .from("race_goals")
        .update({ is_active: false })
        .eq("student_id", studentId)
        .eq("is_active", true);

      const { error } = await supabase.from("race_goals").insert({
        student_id: studentId,
        race_type: raceType,
        target_date: targetDate,
        target_time_min: parsedMinutes || null,
        current_weekly_km: weeklyKm || null,
        current_easy_pace_s_per_km: parsedPaceSec || null,
        notes: notes || null,
        is_active: true,
      });
      if (error) throw error;
      toast.success("Objectif enregistré 🏁");
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl h-[90dvh] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <SheetTitle className="text-base">
            {existingGoal ? "Modifier l'objectif" : "Nouvel objectif de course"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Type de course
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {RACE_TYPES.map((rt) => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setRaceType(rt)}
                    className={`shrink-0 min-h-[44px] px-4 rounded-full border text-sm font-medium transition-colors ${
                      raceType === rt
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground hover:bg-accent/30"
                    }`}
                  >
                    {RACE_TYPE_LABELS[rt]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="race-date" className="text-xs uppercase tracking-wide text-muted-foreground">
                Date de la course
              </Label>
              <Input
                id="race-date"
                type="date"
                min={minDate()}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="race-time" className="text-xs uppercase tracking-wide text-muted-foreground">
                Objectif chrono (optionnel)
              </Label>
              <Input
                id="race-time"
                type="text"
                placeholder="HH:MM:SS — ex. 01:45:00"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="min-h-[44px] tabular-nums"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Volume hebdo actuel
                </Label>
                <span className="px-2 py-0.5 rounded-md bg-bg-tinted text-xs font-semibold tabular-nums">
                  {weeklyKm} km
                </span>
              </div>
              <Slider
                value={[weeklyKm]}
                onValueChange={(v) => setWeeklyKm(v[0])}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="race-pace" className="text-xs uppercase tracking-wide text-muted-foreground">
                Allure facile actuelle (optionnel)
              </Label>
              <Input
                id="race-pace"
                type="text"
                placeholder="mm:ss /km — ex. 5:45"
                value={paceInput}
                onChange={(e) => setPaceInput(e.target.value)}
                className="min-h-[44px] tabular-nums"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="race-notes" className="text-xs uppercase tracking-wide text-muted-foreground">
                Notes (optionnel)
              </Label>
              <Textarea
                id="race-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Contraintes, antécédents, préférences…"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="border-t border-border p-3 flex gap-2">
          <Button variant="ghost" className="flex-1 min-h-[44px]" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button className="flex-1 min-h-[44px]" onClick={handleSave} disabled={saving}>
            {saving ? "…" : "Enregistrer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RaceGoalSetupSheet;