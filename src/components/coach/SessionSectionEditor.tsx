import { SessionSectionData, SessionExerciseData } from "@/types/coach";
import { ChevronDown, ChevronUp, Trash2, GripVertical, Plus, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SessionExerciseCard from "./SessionExerciseCard";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SessionSectionEditorProps {
  section: SessionSectionData;
  onUpdate: (updated: SessionSectionData) => void;
  onRemove: () => void;
  onAddExercise: () => void;
}

const SessionSectionEditor = ({ section, onUpdate, onRemove, onAddExercise }: SessionSectionEditorProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const updateExercise = (index: number, updated: SessionExerciseData) => {
    const exs = [...section.exercises];
    exs[index] = updated;
    onUpdate({ ...section, exercises: exs });
  };

  const removeExercise = (index: number) => {
    onUpdate({ ...section, exercises: section.exercises.filter((_, i) => i !== index) });
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const exs = [...section.exercises];
    const target = index + direction;
    if (target < 0 || target >= exs.length) return;
    [exs[index], exs[target]] = [exs[target], exs[index]];
    exs.forEach((e, i) => (e.sortOrder = i));
    onUpdate({ ...section, exercises: exs });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-secondary/30">
      {/* Section header */}
      <div className="flex items-center gap-2 p-2.5 bg-secondary/50">
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} /> : <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />}
        </button>
        <Input
          value={section.icon || ""}
          onChange={(e) => onUpdate({ ...section, icon: e.target.value || undefined })}
          placeholder="🏋️"
          className="w-10 h-7 text-center bg-transparent border-none p-0 text-sm focus-visible:ring-0"
        />
        <Input
          value={section.name}
          onChange={(e) => onUpdate({ ...section, name: e.target.value })}
          className="h-7 bg-transparent border-none p-0 font-semibold text-sm focus-visible:ring-0 flex-1"
          placeholder="Nom de la section"
        />
        <Input
          value={section.durationEstimate || ""}
          onChange={(e) => onUpdate({ ...section, durationEstimate: e.target.value || undefined })}
          placeholder="10 min"
          className="w-20 h-7 text-center bg-surface text-[11px] border-none"
        />
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors p-1">
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Section notes */}
      {!collapsed && (
        <div className="px-2.5 pt-2">
          <Input
            value={section.notes || ""}
            onChange={(e) => onUpdate({ ...section, notes: e.target.value || undefined })}
            placeholder="Notes de section (optionnel)..."
            className="h-7 bg-transparent border-dashed text-xs italic"
          />
        </div>
      )}

      {/* Exercises */}
      {!collapsed && (
        <div className="p-2.5 space-y-2">
          {section.exercises.map((exItem, i) => (
            <SessionExerciseCard
              key={exItem.id}
              item={exItem}
              index={i}
              total={section.exercises.length}
              onUpdate={(u) => updateExercise(i, u)}
              onRemove={() => removeExercise(i)}
              onMoveUp={() => moveExercise(i, -1)}
              onMoveDown={() => moveExercise(i, 1)}
            />
          ))}
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" onClick={onAddExercise}>
            <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
            Ajouter un exercice
          </Button>
        </div>
      )}
    </div>
  );
};

export default SessionSectionEditor;
