import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProgramData, WeekData, MOCK_STUDENTS } from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Save, Play, CheckCircle } from "lucide-react";
import WeekEditor from "@/components/coach/WeekEditor";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProgramEditor = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const student = MOCK_STUDENTS.find((s) => s.id === studentId);

  const [program, setProgram] = useState<ProgramData>({
    id: crypto.randomUUID(),
    name: "",
    studentId: studentId || "",
    status: "draft",
    weeks: [],
  });

  const [activeWeek, setActiveWeek] = useState<string>("0");

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
    // Regen all IDs
    newWeek.sessions = newWeek.sessions.map((s: any) => ({
      ...s,
      id: crypto.randomUUID(),
      exercises: s.exercises.map((e: any) => ({ ...e, id: crypto.randomUUID() })),
    }));
    setProgram((prev) => ({ ...prev, weeks: [...prev.weeks, newWeek] }));
    setActiveWeek(String(program.weeks.length));
    toast.success(`Semaine ${source.weekNumber} dupliquée`);
  };

  const handleSave = () => {
    if (!program.name.trim()) {
      toast.error("Donnez un nom au programme");
      return;
    }
    if (program.weeks.length === 0) {
      toast.error("Ajoutez au moins une semaine");
      return;
    }
    toast.success("Programme sauvegardé !");
  };

  const handleActivate = () => {
    setProgram((prev) => ({ ...prev, status: "active" }));
    toast.success("Programme activé pour l'élève !");
  };

  const statusConfig = {
    draft: { label: "Brouillon", variant: "secondary" as const },
    active: { label: "Actif", variant: "default" as const },
    completed: { label: "Terminé", variant: "outline" as const },
  };

  const totalSessions = program.weeks.reduce((acc, w) => acc + w.sessions.length, 0);
  const totalExercises = program.weeks.reduce(
    (acc, w) => acc + w.sessions.reduce((a, s) => a + s.exercises.length, 0),
    0
  );

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

          {/* Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{program.weeks.length} semaine{program.weeks.length !== 1 ? "s" : ""}</span>
            <span>{totalSessions} séance{totalSessions !== 1 ? "s" : ""}</span>
            <span>{totalExercises} exercice{totalExercises !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleSave} variant="outline" size="sm">
          <Save className="w-4 h-4 mr-1" />
          Sauvegarder
        </Button>
        {program.status === "draft" && program.weeks.length > 0 && (
          <Button onClick={handleActivate} size="sm">
            <Play className="w-4 h-4 mr-1" />
            Activer le programme
          </Button>
        )}
      </div>

      {/* Weeks */}
      {program.weeks.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center space-y-4">
          <p className="text-muted-foreground">Commencez par ajouter une semaine type</p>
          <Button onClick={addWeek}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter la semaine 1
          </Button>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default ProgramEditor;
