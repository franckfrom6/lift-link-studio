import { SessionData, SessionExerciseData, SessionSectionData, DAY_NAMES, Exercise } from "@/types/coach";
import { Plus, Trash2, ChevronDown, ChevronUp, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SessionExerciseCard from "./SessionExerciseCard";
import { useState } from "react";
import ExercisePicker from "./ExercisePicker";
import SessionSectionEditor from "./SessionSectionEditor";

interface SessionEditorProps {
  session: SessionData;
  onUpdate: (updated: SessionData) => void;
  onRemove: () => void;
}

const SessionEditor = ({ session, onUpdate, onRemove }: SessionEditorProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addToSectionId, setAddToSectionId] = useState<string | null>(null);

  const addSection = () => {
    const newSection: SessionSectionData = {
      id: crypto.randomUUID(),
      name: `Section ${(session.sections?.length || 0) + 1}`,
      sortOrder: (session.sections?.length || 0),
      exercises: [],
    };
    onUpdate({ ...session, sections: [...(session.sections || []), newSection] });
  };

  const updateSection = (index: number, updated: SessionSectionData) => {
    const sections = [...(session.sections || [])];
    sections[index] = updated;
    onUpdate({ ...session, sections });
  };

  const removeSection = (index: number) => {
    const removedSection = session.sections?.[index];
    const movedExercises = removedSection?.exercises || [];
    onUpdate({
      ...session,
      sections: (session.sections || []).filter((_, i) => i !== index),
      exercises: [...session.exercises, ...movedExercises],
    });
  };

  const addExercise = (exercise: Exercise, sectionId?: string | null) => {
    const newExercise: SessionExerciseData = {
      id: crypto.randomUUID(),
      exercise,
      sortOrder: 0,
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      restSeconds: 90,
      sectionId: sectionId || undefined,
    };

    if (sectionId) {
      const sections = [...(session.sections || [])];
      const sIdx = sections.findIndex(s => s.id === sectionId);
      if (sIdx >= 0) {
        newExercise.sortOrder = sections[sIdx].exercises.length;
        sections[sIdx] = { ...sections[sIdx], exercises: [...sections[sIdx].exercises, newExercise] };
        onUpdate({ ...session, sections });
      }
    } else {
      newExercise.sortOrder = session.exercises.length;
      onUpdate({ ...session, exercises: [...session.exercises, newExercise] });
    }
  };

  const updateExercise = (index: number, updated: SessionExerciseData) => {
    const exs = [...session.exercises];
    exs[index] = updated;
    onUpdate({ ...session, exercises: exs });
  };

  const removeExercise = (index: number) => {
    onUpdate({ ...session, exercises: session.exercises.filter((_, i) => i !== index) });
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const exs = [...session.exercises];
    const target = index + direction;
    if (target < 0 || target >= exs.length) return;
    [exs[index], exs[target]] = [exs[target], exs[index]];
    exs.forEach((e, i) => (e.sortOrder = i));
    onUpdate({ ...session, exercises: exs });
  };

  const allExerciseIds = [
    ...session.exercises.map(e => e.exercise.id),
    ...(session.sections || []).flatMap(s => s.exercises.map(e => e.exercise.id)),
  ];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Session header */}
      <div className="flex items-center gap-3 p-3 bg-secondary/50">
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronDown className="w-4 h-4" strokeWidth={1.5} /> : <ChevronUp className="w-4 h-4" strokeWidth={1.5} />}
        </button>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
          {DAY_NAMES[session.dayOfWeek]?.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <Input
            value={session.name}
            onChange={(e) => onUpdate({ ...session, name: e.target.value })}
            className="h-8 bg-transparent border-none p-0 font-semibold text-sm focus-visible:ring-0"
            placeholder="Nom de la séance"
          />
          <p className="text-[11px] text-muted-foreground">
            {DAY_NAMES[session.dayOfWeek]} · {session.exercises.length + (session.sections || []).reduce((a, s) => a + s.exercises.length, 0)} exercice{session.exercises.length !== 1 ? "s" : ""} · {(session.sections || []).length} section{(session.sections || []).length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors p-1">
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="p-3 space-y-4">
          {(session.sections || []).map((section, i) => (
            <SessionSectionEditor
              key={section.id}
              section={section}
              onUpdate={(u) => updateSection(i, u)}
              onRemove={() => removeSection(i)}
              onAddExercise={() => { setAddToSectionId(section.id); setPickerOpen(true); }}
            />
          ))}

          {session.exercises.length > 0 && (
            <div className="space-y-3">
              {(session.sections || []).length > 0 && (
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] font-semibold px-1">
                  Exercices hors section
                </p>
              )}
              {session.exercises.map((exItem, i) => (
                <SessionExerciseCard
                  key={exItem.id}
                  item={exItem}
                  index={i}
                  total={session.exercises.length}
                  onUpdate={(u) => updateExercise(i, u)}
                  onRemove={() => removeExercise(i)}
                  onMoveUp={() => moveExercise(i, -1)}
                  onMoveDown={() => moveExercise(i, 1)}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setAddToSectionId(null); setPickerOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Exercice
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={addSection}>
              <FolderPlus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Section
            </Button>
          </div>
        </div>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); setAddToSectionId(null); }}
        onSelect={(ex) => addExercise(ex, addToSectionId)}
        excludeIds={allExerciseIds}
      />
    </div>
  );
};

export default SessionEditor;
