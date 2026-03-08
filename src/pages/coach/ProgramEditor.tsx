import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProgramData, WeekData, SessionSectionData, SessionExerciseData, SessionData, MOCK_STUDENTS } from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Save, Play, Sparkles, Wand2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import WeekEditor from "@/components/coach/WeekEditor";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGenerateProgram } from "@/hooks/useGenerateProgram";
import { saveProgram } from "@/hooks/useSaveProgram";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProgressionTimeline, { ProgressionPhase } from "@/components/student/ProgressionTimeline";

const ProgramEditor = () => {
  const { studentId, programId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation(["program", "common"]);
  const student = MOCK_STUDENTS.find((s) => s.id === studentId);
  const { generate, loading: aiLoading } = useGenerateProgram();

  const [program, setProgram] = useState<ProgramData>({
    id: programId || crypto.randomUUID(),
    name: "",
    studentId: studentId || "",
    status: "draft",
    weeks: [],
  });

  const [initialLoading, setInitialLoading] = useState(!!programId);

  const [activeWeek, setActiveWeek] = useState<string>("0");
  const [saving, setSaving] = useState(false);

  // AI generation state
  const [showAI, setShowAI] = useState(true);
  const [aiMode, setAiMode] = useState<"guided" | "free">("guided");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiForm, setAiForm] = useState({
    objective: student?.goal || "",
    level: student?.level || "Intermédiaire",
    frequency: "3x/semaine",
    duration: "1h",
    equipment: "Salle complète",
    notes: "",
  });

  const addWeek = () => {
    const newWeek: WeekData = {
      id: crypto.randomUUID(),
      weekNumber: program.weeks.length + 1,
      sessions: [],
    };
    setProgram((prev) => ({ ...prev, weeks: [...prev.weeks, newWeek] }));
    setActiveWeek(String(program.weeks.length));
  };

  const updateWeek = (index: number, updated: WeekData) => {
    const weeks = [...program.weeks];
    weeks[index] = updated;
    setProgram((prev) => ({ ...prev, weeks }));
  };

  const duplicateWeek = (index: number) => {
    const source = program.weeks[index];
    const newWeek: WeekData = {
      ...JSON.parse(JSON.stringify(source)),
      id: crypto.randomUUID(),
      weekNumber: program.weeks.length + 1,
    };
    newWeek.sessions = newWeek.sessions.map((s: any) => ({
      ...s,
      id: crypto.randomUUID(),
      sections: (s.sections || []).map((sec: any) => ({
        ...sec,
        id: crypto.randomUUID(),
        exercises: sec.exercises.map((e: any) => ({ ...e, id: crypto.randomUUID() })),
      })),
      exercises: s.exercises.map((e: any) => ({ ...e, id: crypto.randomUUID() })),
    }));
    setProgram((prev) => ({ ...prev, weeks: [...prev.weeks, newWeek] }));
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
    if (!user) {
      toast.error(t("program:error_not_logged_in"));
      return;
    }
    if (!studentId) {
      toast.error("Student ID is missing");
      return;
    }
    setSaving(true);
    const result = await saveProgram(program, user.id, studentId);
    setSaving(false);
    if (result) {
      toast.success(t("program:program_saved"));
    }
  };

  const handleActivate = () => {
    setProgram((prev) => ({ ...prev, status: "active" }));
    toast.success(t("program:program_activated"));
  };

  const handleAIGenerate = async () => {
    const promptText = aiMode === "free" ? aiPrompt : (aiForm.notes || aiPrompt);
    const structured = aiMode === "guided" ? aiForm : undefined;

    if (aiMode === "free" && !aiPrompt.trim()) {
      toast.error(t("program:error_describe_program"));
      return;
    }

    const result = await generate(promptText, structured);
    if (result) {
      setProgram({
        ...result,
        studentId: studentId || "",
      });
      setShowAI(false);
      setActiveWeek("0");
    }
  };

  const totalSessions = program.weeks.reduce((acc, w) => acc + w.sessions.length, 0);
  const totalExercises = program.weeks.reduce(
    (acc, w) =>
      acc +
      w.sessions.reduce(
        (a, s) =>
          a + s.exercises.length + (s.sections || []).reduce((sa, sec) => sa + sec.exercises.length, 0),
        0
      ),
    0
  );

  // Convert progression for display
  const progressionPhases: ProgressionPhase[] = (program.progression || []).map((p, i) => ({
    id: `prog-${i}`,
    ...p,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {student && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {student.avatar}
                </div>
                <span className="text-sm text-muted-foreground">{student.name}</span>
              </div>
            )}
            <Badge variant={program.status === "draft" ? "secondary" : program.status === "active" ? "default" : "outline"}>
              {t(`program:status.${program.status}`)}
            </Badge>
          </div>
          <Input
            value={program.name}
            onChange={(e) => setProgram((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={t("program:program_name_placeholder")}
            className="text-xl font-display font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
          />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{program.weeks.length} {program.weeks.length !== 1 ? t("program:weeks_count_plural", { count: program.weeks.length }).split(" ").slice(1).join(" ") : t("program:weeks_count", { count: 1 }).split(" ").slice(1).join(" ")}</span>
            <span>{totalSessions} {totalSessions !== 1 ? t("program:sessions_count_plural", { count: totalSessions }).split(" ").slice(1).join(" ") : t("program:sessions_count", { count: 1 }).split(" ").slice(1).join(" ")}</span>
            <span>{totalExercises} {totalExercises !== 1 ? t("program:exercises_count_plural", { count: totalExercises }).split(" ").slice(1).join(" ") : t("program:exercises_count", { count: 1 }).split(" ").slice(1).join(" ")}</span>
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
          <Button onClick={handleActivate} size="sm">
            <Play className="w-4 h-4 mr-1" />
            {t("program:activate_program")}
          </Button>
        )}
        <Button
          onClick={() => setShowAI(!showAI)}
          variant={showAI ? "secondary" : "outline"}
          size="sm"
          className="ml-auto"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          {t("program:generate_ai")}
        </Button>
      </div>

      {/* AI Generation Panel */}
      {showAI && (
        <div className="glass rounded-xl p-5 space-y-4 border-primary/20 glow-primary animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-sm">{t("program:ai_generation")}</h3>
            </div>
            <button
              onClick={() => setAiMode(aiMode === "guided" ? "free" : "guided")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {aiMode === "guided" ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  {t("program:guided_mode")}
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 text-primary" />
                  {t("program:free_mode")}
                </>
              )}
            </button>
          </div>

          {aiMode === "guided" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase">{t("program:ai_objective")}</label>
                <Input
                  value={aiForm.objective}
                  onChange={(e) => setAiForm({ ...aiForm, objective: e.target.value })}
                  placeholder={t("program:ai_objective_placeholder")}
                  className="h-9 bg-surface text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase">{t("program:ai_level")}</label>
                <Select value={aiForm.level} onValueChange={(v) => setAiForm({ ...aiForm, level: v })}>
                  <SelectTrigger className="h-9 bg-surface text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Débutant">{t("program:levels.beginner")}</SelectItem>
                    <SelectItem value="Intermédiaire">{t("program:levels.intermediate")}</SelectItem>
                    <SelectItem value="Avancé">{t("program:levels.advanced")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase">{t("program:ai_frequency")}</label>
                <Select value={aiForm.frequency} onValueChange={(v) => setAiForm({ ...aiForm, frequency: v })}>
                  <SelectTrigger className="h-9 bg-surface text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(n => (
                      <SelectItem key={n} value={`${n}x/semaine`}>{n}x / {t("calendar:per_week").replace("x/", "")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase">{t("program:ai_duration")}</label>
                <Select value={aiForm.duration} onValueChange={(v) => setAiForm({ ...aiForm, duration: v })}>
                  <SelectTrigger className="h-9 bg-surface text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30min">30 min</SelectItem>
                    <SelectItem value="45min">45 min</SelectItem>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="1h15">1h15</SelectItem>
                    <SelectItem value="1h30">1h30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-muted-foreground font-medium uppercase">{t("program:ai_equipment")}</label>
                <Input
                  value={aiForm.equipment}
                  onChange={(e) => setAiForm({ ...aiForm, equipment: e.target.value })}
                  placeholder={t("program:ai_equipment_placeholder")}
                  className="h-9 bg-surface text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-muted-foreground font-medium uppercase">{t("program:ai_instructions")}</label>
                <Textarea
                  value={aiForm.notes}
                  onChange={(e) => setAiForm({ ...aiForm, notes: e.target.value })}
                  placeholder={t("program:ai_instructions_placeholder")}
                  className="bg-surface text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={t("program:ai_free_placeholder")}
              className="bg-surface text-sm resize-none min-h-[120px]"
              rows={5}
            />
          )}

          <Button
            onClick={handleAIGenerate}
            disabled={aiLoading}
            className="w-full"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("program:generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t("program:generate_program")}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Progression timeline */}
      {progressionPhases.length > 0 && (
        <div className="glass rounded-xl p-4 space-y-3">
          <h3 className="font-display font-bold text-sm">{t("session:progression_plan")}</h3>
          <ProgressionTimeline phases={progressionPhases} currentWeek={1} />
        </div>
      )}

      {/* Weeks */}
      {program.weeks.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center space-y-4">
          <p className="text-muted-foreground">{t("program:start_with_ai")}</p>
          <Button onClick={addWeek}>
            <Plus className="w-4 h-4 mr-2" />
            {t("program:add_week", { number: 1 })}
          </Button>
        </div>
      ) : (
        <Tabs value={activeWeek} onValueChange={setActiveWeek}>
          <div className="flex items-center gap-2">
            <TabsList className="bg-surface">
              {program.weeks.map((w, i) => (
                <TabsTrigger key={w.id} value={String(i)} className="text-xs">
                  S{w.weekNumber}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button variant="ghost" size="sm" onClick={addWeek}>
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

export default ProgramEditor;
