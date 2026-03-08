import { SessionData, SessionExerciseData, DAY_NAMES, Exercise } from "@/types/coach";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SessionExerciseCard from "./SessionExerciseCard";
import { useState } from "react";
import ExercisePicker from "./ExercisePicker";

interface SessionEditorProps {
  session: SessionData;
  onUpdate: (updated: SessionData) => void;
  onRemove: () => void;
}

const SessionEditor = ({ session, onUpdate, onRemove }: SessionEditorProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const addExercise = (exercise: Exercise) => {
    const newExercise: SessionExerciseData = {
      id: crypto.randomUUID(),
      exercise,
      sortOrder: session.exercises.length,
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      restSeconds: 90,
    };
    onUpdate({ ...session, exercises: [...session.exercises, newExercise] });
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

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Session header */}
      <div className="flex items-center gap-3 p-3 bg-surface/50">
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
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
            {DAY_NAMES[session.dayOfWeek]} · {session.exercises.length} exercice{session.exercises.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors p-1">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Exercises list */}
      {!collapsed && (
        <div className="p-3 space-y-3">
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

          <Button variant="outline" size="sm" className="w-full" onClick={() => setPickerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un exercice
          </Button>
        </div>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addExercise}
        excludeIds={session.exercises.map((e) => e.exercise.id)}
      />
    </div>
  );
};

export default SessionEditor;
