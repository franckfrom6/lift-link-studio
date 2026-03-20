import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Trash2, GripVertical, ArrowLeft, Dumbbell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatLocalDate } from "@/lib/date-utils";
import { useExercises } from "@/hooks/useExercises";
import { useExerciseSearch } from "@/hooks/useExerciseSearch";

interface FreeExercise {
  exercise_id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  type: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  notes: string;
}

interface FreeSessionCreatorProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  onCreated: () => void;
}

const MUSCLE_FILTERS = ["pectoraux", "dos", "jambes", "épaules", "bras", "abdominaux"];

const FreeSessionCreator = ({ open, onClose, date, onCreated }: FreeSessionCreatorProps) => {
  const { t, i18n } = useTranslation("session");
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [sessionName, setSessionName] = useState("");
  const [durationMin, setDurationMin] = useState(60);

  // Step 2
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [exercises, setExercises] = useState<FreeExercise[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchExercises = async (query: string, muscle: string | null) => {
    setSearching(true);
    let q = supabase.from("exercises").select("id, name, name_en, muscle_group, equipment, type, tracking_type").eq("is_default", true).limit(20);
    if (query.trim()) {
      q = q.or(`name.ilike.%${query}%,name_en.ilike.%${query}%`);
    }
    if (muscle) {
      q = q.eq("muscle_group", muscle);
    }
    const { data } = await q.order("name");
    setSearchResults(data || []);
    setSearching(false);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (val.length >= 2 || muscleFilter) searchExercises(val, muscleFilter);
  };

  const handleMuscleFilter = (muscle: string) => {
    const newFilter = muscleFilter === muscle ? null : muscle;
    setMuscleFilter(newFilter);
    searchExercises(search, newFilter);
  };

  const addExercise = (ex: any) => {
    if (exercises.find(e => e.exercise_id === ex.id)) return;
    const isCompound = ex.type === "compound";
    setExercises(prev => [...prev, {
      exercise_id: ex.id,
      name: i18n.language === "en" && ex.name_en ? ex.name_en : ex.name,
      muscle_group: ex.muscle_group,
      equipment: ex.equipment,
      type: ex.type,
      sets: isCompound ? 4 : 3,
      reps_min: isCompound ? 8 : 12,
      reps_max: isCompound ? 10 : 15,
      rest_seconds: isCompound ? 90 : 60,
      notes: "",
    }]);
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, field: keyof FreeExercise, value: any) => {
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const handleCreate = async () => {
    if (!user || exercises.length === 0 || !sessionName.trim()) return;
    setSaving(true);

    try {
      // Create session (no week_id for free sessions)
      const { data: session, error: sessionError } = await supabase.from("sessions").insert({
        name: sessionName.trim(),
        day_of_week: date.getDay() === 0 ? 7 : date.getDay(),
        is_free_session: true,
        created_by: user.id,
        free_session_date: formatLocalDate(date),
      }).select("id").single();

      if (sessionError || !session) throw sessionError;

      // Insert exercises
      const exerciseRows = exercises.map((ex, i) => ({
        session_id: session.id,
        exercise_id: ex.exercise_id,
        sort_order: i,
        sets: ex.sets,
        reps_min: ex.reps_min,
        reps_max: ex.reps_max,
        rest_seconds: ex.rest_seconds,
        coach_notes: ex.notes || null,
      }));

      const { error: exError } = await supabase.from("session_exercises").insert(exerciseRows);
      if (exError) throw exError;

      toast.success(t("free_session_created"));
      resetForm();
      onCreated();
      onClose();
    } catch (e) {
      console.error("Error creating free session:", e);
      toast.error(t("free_session_error"));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSessionName("");
    setDurationMin(60);
    setSearch("");
    setMuscleFilter(null);
    setSearchResults([]);
    setExercises([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const dateStr = date.toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-US", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="h-[90dvh] flex flex-col p-0">
        <SheetHeader className="p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            )}
            <SheetTitle className="text-base">
              {step === 1 ? t("free_session_title") : t("free_session_add_exercises")}
            </SheetTitle>
          </div>
        </SheetHeader>

        {step === 1 ? (
          <div className="flex-1 p-4 space-y-4">
            <p className="text-sm text-muted-foreground">{dateStr}</p>
            <div className="space-y-2">
              <Label>{t("free_session_name")} *</Label>
              <Input
                placeholder={t("free_session_name_placeholder")}
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>{t("free_session_duration")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  className="w-24"
                  min={10}
                  max={180}
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>
            <Button
              className="w-full mt-6"
              onClick={() => { setStep(2); searchExercises("", null); }}
              disabled={!sessionName.trim()}
            >
              {t("free_session_next")}
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search + filters */}
            <div className="p-4 space-y-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("free_session_search")}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_FILTERS.map((m) => (
                  <button
                    key={m}
                    onClick={() => handleMuscleFilter(m)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      muscleFilter === m
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map((ex) => {
                      const added = exercises.some(e => e.exercise_id === ex.id);
                      return (
                        <button
                          key={ex.id}
                          onClick={() => !added && addExercise(ex)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
                            added ? "bg-primary/5 opacity-60" : "hover:bg-secondary"
                          )}
                          disabled={added}
                        >
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {i18n.language === "en" && ex.name_en ? ex.name_en : ex.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {ex.muscle_group} · {ex.equipment} · {ex.type}
                            </p>
                          </div>
                          {added ? (
                            <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                          ) : (
                            <Plus className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {searchResults.length === 0 && !searching && (search.length >= 2 || muscleFilter) && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("free_session_no_results")}</p>
                )}

                {/* Added exercises */}
                {exercises.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                      {t("free_session_added", { count: exercises.length })}
                    </h3>
                    {exercises.map((ex, idx) => (
                      <div key={ex.exercise_id} className="glass p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium flex-1 truncate">{idx + 1}. {ex.name}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeExercise(idx)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" strokeWidth={1.5} />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[9px] uppercase">{t("free_session_sets")}</Label>
                            <Input
                              type="number" min={1} max={10} value={ex.sets}
                              onChange={(e) => updateExercise(idx, "sets", Number(e.target.value))}
                              className="h-8 text-xs text-center"
                            />
                          </div>
                          <div>
                            <Label className="text-[9px] uppercase">Reps</Label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number" min={1} max={50} value={ex.reps_min}
                                onChange={(e) => updateExercise(idx, "reps_min", Number(e.target.value))}
                                className="h-8 text-xs text-center"
                              />
                              <span className="text-muted-foreground text-xs">-</span>
                              <Input
                                type="number" min={1} max={50} value={ex.reps_max}
                                onChange={(e) => updateExercise(idx, "reps_max", Number(e.target.value))}
                                className="h-8 text-xs text-center"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[9px] uppercase">{t("free_session_rest")}</Label>
                            <Input
                              type="number" min={0} max={300} step={15} value={ex.rest_seconds}
                              onChange={(e) => updateExercise(idx, "rest_seconds", Number(e.target.value))}
                              className="h-8 text-xs text-center"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom CTA */}
            <div className="p-4 border-t border-border shrink-0">
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={exercises.length === 0 || saving}
              >
                {saving ? t("free_session_saving") : t("free_session_create", { count: exercises.length })}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default FreeSessionCreator;
