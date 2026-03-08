import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProgramData, WeekData, SessionSectionData, MOCK_STUDENTS } from "@/types/coach";
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
import ProgressionTimeline, { ProgressionPhase } from "@/components/student/ProgressionTimeline";

const ProgramEditor = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const student = MOCK_STUDENTS.find((s) => s.id === studentId);
  const { generate, loading: aiLoading } = useGenerateProgram();

  const [program, setProgram] = useState<ProgramData>({
    id: crypto.randomUUID(),
    name: "",
    studentId: studentId || "",
    status: "draft",
    weeks: [],
  });

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
    toast.success(`Semaine ${source.weekNumber} dupliquée`);
  };

  const handleSave = async () => {
    if (!program.name.trim()) {
      toast.error("Donnez un nom au programme");
      return;
    }
    if (program.weeks.length === 0) {
      toast.error("Ajoutez au moins une semaine");
      return;
    }
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }
    setSaving(true);
    const result = await saveProgram(program, user.id, studentId || "");
    setSaving(false);
    if (result) {
      toast.success("Programme sauvegardé !");
    }
  };

  const handleActivate = () => {
    setProgram((prev) => ({ ...prev, status: "active" }));
    toast.success("Programme activé pour l'élève !");
  };

  const handleAIGenerate = async () => {
    const promptText = aiMode === "free" ? aiPrompt : (aiForm.notes || aiPrompt);
    const structured = aiMode === "guided" ? aiForm : undefined;

    if (aiMode === "free" && !aiPrompt.trim()) {
      toast.error("Décrivez le programme que vous souhaitez générer");
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

  const statusConfig = {
    draft: { label: "Brouillon", variant: "secondary" as const },
    active: { label: "Actif", variant: "default" as const },
    completed: { label: "Terminé", variant: "outline" as const },
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
            <Badge variant={statusConfig[program.status].variant}>
              {statusConfig[program.status].label}
            </Badge>
          </div>
          <Input
            value={program.name}
            onChange={(e) => setProgram((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nom du programme (ex: PPL 4 semaines)"
            className="text-xl font-display font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
          />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{program.weeks.length} semaine{program.weeks.length !== 1 ? "s" : ""}</span>
            <span>{totalSessions} séance{totalSessions !== 1 ? "s" : ""}</span>
            <span>{totalExercises} exercice{totalExercises !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleSave} variant="outline" size="sm" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Sauvegarder
        </Button>
        {program.status === "draft" && program.weeks.length > 0 && (
          <Button onClick={handleActivate} size="sm">
            <Play className="w-4 h-4 mr-1" />
            Activer le programme
          </Button>
        )}
        <Button
          onClick={() => setShowAI(!showAI)}
          variant={showAI ? "secondary" : "outline"}
          size="sm"
          className="ml-auto"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Générer avec l'IA
        </Button>
      </div>

      {/* AI Generation Panel */}
      {showAI && (
        <div className="glass rounded-xl p-5 space-y-4 border-primary/20 glow-primary animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-sm">Génération IA</h3>
            </div>
            <button
              onClick={() => setAiMode(aiMode === "guided" ? "free" : "guided")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {aiMode === "guided" ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Mode guidé
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 text-primary" />
                  Mode libre
                </>
              )}
            </button>
          </div>

          {aiMode === "guided" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase">Objectif</label>
                <Input
                  value={aiForm.objective}
                  onChange={(e) => setAiForm({ ...aiForm, objective: e.target.value })}
                  placeholder="Hypertrophie fessiers, prise de masse..."
                  className="h-9 bg-surface text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase">Niveau</label>
                <Select value={aiForm.level} onValueChange={(v) => setAiForm({ ...aiForm, level: v })}>
                  <SelectTrigger className="h-9 bg-surface text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Débutant">Débutant</SelectItem>
                    <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                    <SelectItem value="Avancé">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase">Fréquence</label>
                <Select value={aiForm.frequency} onValueChange={(v) => setAiForm({ ...aiForm, frequency: v })}>
                  <SelectTrigger className="h-9 bg-surface text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x/semaine">1x / semaine</SelectItem>
                    <SelectItem value="2x/semaine">2x / semaine</SelectItem>
                    <SelectItem value="3x/semaine">3x / semaine</SelectItem>
                    <SelectItem value="4x/semaine">4x / semaine</SelectItem>
                    <SelectItem value="5x/semaine">5x / semaine</SelectItem>
                    <SelectItem value="6x/semaine">6x / semaine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase">Durée / séance</label>
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
                <label className="text-[11px] text-muted-foreground font-medium uppercase">Équipement</label>
                <Input
                  value={aiForm.equipment}
                  onChange={(e) => setAiForm({ ...aiForm, equipment: e.target.value })}
                  placeholder="Salle complète, home gym, poids du corps..."
                  className="h-9 bg-surface text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-muted-foreground font-medium uppercase">Instructions supplémentaires</label>
                <Textarea
                  value={aiForm.notes}
                  onChange={(e) => setAiForm({ ...aiForm, notes: e.target.value })}
                  placeholder="Ex: Focus glutes et ischios, éviter les exercices avec impact, inclure du tempo training..."
                  className="bg-surface text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Décrivez le programme que vous souhaitez...&#10;&#10;Ex: Programme lower body pour femme avancée, 1x/semaine en salle, focus hypertrophie fessiers et ischios avec surcharge progressive sur 8 semaines. Inclure warm-up, 2 blocs compounds, 1 bloc isolation et cool-down."
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
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer le programme
              </>
            )}
          </Button>
        </div>
      )}

      {/* Progression timeline */}
      {progressionPhases.length > 0 && (
        <div className="glass rounded-xl p-4 space-y-3">
          <h3 className="font-display font-bold text-sm">Plan de progression</h3>
          <ProgressionTimeline phases={progressionPhases} currentWeek={1} />
        </div>
      )}

      {/* Weeks */}
      {program.weeks.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center space-y-4">
          <p className="text-muted-foreground">Commencez par ajouter une semaine type ou générez avec l'IA</p>
          <Button onClick={addWeek}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter la semaine 1
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
