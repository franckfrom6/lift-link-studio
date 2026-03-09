import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProgramData, WeekData, SessionData, SessionSectionData, SessionExerciseData } from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Save, Play, Loader2, Dumbbell } from "lucide-react";
import WeekEditor from "@/components/coach/WeekEditor";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveProgram } from "@/hooks/useSaveProgram";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AthleteProgramEditor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation(["program", "common", "calendar"]);

  const [program, setProgram] = useState<ProgramData>({
    id: crypto.randomUUID(),
    name: "",
    studentId: user?.id || "",
    status: "draft",
    weeks: [],
  });

  const [activeWeek, setActiveWeek] = useState<string>("0");
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load existing self-guided program if any
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: existing } = await supabase
        .from("programs")
        .select("*")
        .eq("student_id", user.id)
        .is("coach_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existing) {
        setProgram(prev => ({ ...prev, studentId: user.id }));
        setInitialLoading(false);
        return;
      }

      // Load full program
      const { data: weeks } = await supabase
        .from("program_weeks").select("*").eq("program_id", existing.id).order("week_number");
      
      if (!weeks || weeks.length === 0) {
        setProgram({
          id: existing.id, name: existing.name, studentId: existing.student_id,
          status: existing.status as ProgramData["status"], weeks: [],
        });
        setInitialLoading(false);
        return;
      }

      const weekIds = weeks.map(w => w.id);
      const { data: sessions } = await supabase.from("sessions").select("*").in("week_id", weekIds).order("day_of_week");
      const sessionIds = (sessions || []).map(s => s.id);
      const { data: sections } = await supabase.from("session_sections").select("*").in("session_id", sessionIds).order("sort_order");
      const { data: exercises } = await supabase.from("session_exercises").select("*, exercise:exercises(*)").in("session_id", sessionIds).order("sort_order");

      const sectionMap = new Map<string, SessionSectionData>();
      for (const sec of (sections || [])) {
        sectionMap.set(sec.id, {
          id: sec.id, name: sec.name, icon: sec.icon || undefined,
          sortOrder: sec.sort_order, durationEstimate: sec.duration_estimate || undefined,
          notes: sec.notes || undefined, exercises: [],
        });
      }

      for (const ex of (exercises || [])) {
        const mapped: SessionExerciseData = {
          id: ex.id, exercise: ex.exercise as any, sortOrder: ex.sort_order,
          sets: ex.sets, repsMin: ex.reps_min, repsMax: ex.reps_max,
          restSeconds: ex.rest_seconds, suggestedWeight: ex.suggested_weight || undefined,
          coachNotes: ex.coach_notes || undefined, tempo: ex.tempo || undefined,
          rpeTarget: ex.rpe_target || undefined, videoUrl: ex.video_url || undefined,
          videoSearchQuery: ex.video_search_query || undefined, sectionId: ex.section_id || undefined,
        };
        if (ex.section_id && sectionMap.has(ex.section_id)) {
          sectionMap.get(ex.section_id)!.exercises.push(mapped);
        }
      }

      const builtWeeks: WeekData[] = weeks.map(w => ({
        id: w.id, weekNumber: w.week_number,
        sessions: (sessions || []).filter(s => s.week_id === w.id).map((s): SessionData => ({
          id: s.id, name: s.name, dayOfWeek: s.day_of_week, notes: s.notes || undefined,
          sections: (sections || []).filter(sec => sec.session_id === s.id).map(sec => sectionMap.get(sec.id)!).filter(Boolean),
          exercises: (exercises || []).filter(ex => ex.session_id === s.id && !ex.section_id).map((ex): SessionExerciseData => ({
            id: ex.id, exercise: ex.exercise as any, sortOrder: ex.sort_order,
            sets: ex.sets, repsMin: ex.reps_min, repsMax: ex.reps_max,
            restSeconds: ex.rest_seconds, suggestedWeight: ex.suggested_weight || undefined,
            coachNotes: ex.coach_notes || undefined, tempo: ex.tempo || undefined,
            rpeTarget: ex.rpe_target || undefined, videoUrl: ex.video_url || undefined,
            videoSearchQuery: ex.video_search_query || undefined,
          })),
        })),
      }));

      setProgram({
        id: existing.id, name: existing.name, studentId: existing.student_id,
        status: existing.status as ProgramData["status"], weeks: builtWeeks,
      });
      setInitialLoading(false);
    };
    load();
  }, [user]);

  const addWeek = () => {
    const newWeek: WeekData = {
      id: crypto.randomUUID(),
      weekNumber: program.weeks.length + 1,
      sessions: [],
    };
    setProgram(prev => ({ ...prev, weeks: [...prev.weeks, newWeek] }));
    setActiveWeek(String(program.weeks.length));
  };

  const updateWeek = (index: number, updated: WeekData) => {
    const weeks = [...program.weeks];
    weeks[index] = updated;
    setProgram(prev => ({ ...prev, weeks }));
  };

  const duplicateWeek = (index: number) => {
    const source = program.weeks[index];
    const newWeek: WeekData = {
      ...JSON.parse(JSON.stringify(source)),
      id: crypto.randomUUID(),
      weekNumber: program.weeks.length + 1,
    };
    newWeek.sessions = newWeek.sessions.map((s: any) => ({
      ...s, id: crypto.randomUUID(),
      sections: (s.sections || []).map((sec: any) => ({
        ...sec, id: crypto.randomUUID(),
        exercises: sec.exercises.map((e: any) => ({ ...e, id: crypto.randomUUID() })),
      })),
      exercises: s.exercises.map((e: any) => ({ ...e, id: crypto.randomUUID() })),
    }));
    setProgram(prev => ({ ...prev, weeks: [...prev.weeks, newWeek] }));
    setActiveWeek(String(program.weeks.length));
    toast.success(t("program:week_duplicated", { number: source.weekNumber }));
  };

  const handleSave = async () => {
    if (!program.name.trim()) {
      toast.error(t("program:error_no_name"));
      return;
    }
    if (program.weeks.length === 0) {
      toast.error(t("program:error_no_weeks"));
      return;
    }
    if (!user) return;

    setSaving(true);
    const result = await saveProgram(program, null, user.id);
    setSaving(false);
    if (result) {
      toast.success(t("program:program_saved"));
      // Update program ID if it was new
      setProgram(prev => ({ ...prev, id: result.programId }));
    }
  };

  const handleActivate = async () => {
    setProgram(prev => ({ ...prev, status: "active" }));
    // Auto-save on activate
    if (!user) return;
    setSaving(true);
    const activated = { ...program, status: "active" as const };
    const result = await saveProgram(activated, null, user.id);
    setSaving(false);
    if (result) {
      toast.success(t("program:program_activated"));
      navigate("/student");
    }
  };

  const totalSessions = program.weeks.reduce((acc, w) => acc + w.sessions.length, 0);
  const totalExercises = program.weeks.reduce(
    (acc, w) => acc + w.sessions.reduce(
      (a, s) => a + s.exercises.length + (s.sections || []).reduce((sa, sec) => sa + sec.exercises.length, 0), 0
    ), 0
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/student")} className="mt-1 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h1 className="text-lg font-bold">{t("program:my_program", "Mon programme")}</h1>
            <Badge variant={program.status === "draft" ? "secondary" : "default"}>
              {t(`program:status.${program.status}`)}
            </Badge>
          </div>
          <Input
            value={program.name}
            onChange={(e) => setProgram(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t("program:program_name_placeholder")}
            className="text-lg font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
          />
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{program.weeks.length} {t("common:weeks", "semaines")}</span>
            <span>{totalSessions} {t("program:sessions_label", "séances")}</span>
            <span>{totalExercises} {t("program:exercises_label", "exercices")}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleSave} variant="outline" size="sm" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          {t("program:save_program")}
        </Button>
        {program.status === "draft" && program.weeks.length > 0 && (
          <Button onClick={handleActivate} size="sm" disabled={saving}>
            <Play className="w-4 h-4 mr-1" />
            {t("program:activate_program")}
          </Button>
        )}
      </div>

      {/* Weeks */}
      {program.weeks.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center space-y-4">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto" strokeWidth={1.5} />
          <div>
            <p className="font-semibold text-sm">{t("program:empty_program_title", "Créez votre programme")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("program:empty_program_desc", "Ajoutez une semaine, puis des séances et exercices.")}
            </p>
          </div>
          <Button onClick={addWeek}>
            <Plus className="w-4 h-4 mr-2" />
            {t("program:add_week", { number: 1 })}
          </Button>
        </div>
      ) : (
        <Tabs value={activeWeek} onValueChange={setActiveWeek}>
          <div className="flex items-center gap-2">
            <div className="overflow-x-auto -mx-4 px-4 pb-1 flex-1 min-w-0">
              <TabsList className="flex w-max min-w-full gap-1 bg-secondary">
                {program.weeks.map((w, i) => (
                  <TabsTrigger key={w.id} value={String(i)} className="text-xs">
                    S{w.weekNumber}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <Button variant="ghost" size="sm" onClick={addWeek} className="shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {program.weeks.map((week, i) => (
            <TabsContent key={week.id} value={String(i)}>
              <WeekEditor
                week={week}
                onUpdate={(u) => updateWeek(i, u)}
                onDuplicate={() => duplicateWeek(i)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default AthleteProgramEditor;
