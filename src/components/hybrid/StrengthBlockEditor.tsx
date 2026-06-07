import { useState } from "react";
import { Trash2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useExercises } from "@/hooks/useExercises";
import { useExerciseSearch } from "@/hooks/useExerciseSearch";
import { getExerciseName } from "@/lib/exercise-utils";
import {
  StrengthSpec,
  StrengthFormat,
  InlineExercise,
  FORMAT_LABELS,
} from "@/types/hybrid";

interface StrengthBlockEditorProps {
  value: StrengthSpec;
  onChange: (spec: StrengthSpec) => void;
}

const FORMATS: StrengthFormat[] = [
  "straight", "superset", "amrap", "emom", "for_time", "rounds",
];

const GROUPS: NonNullable<InlineExercise["group"]>[] = ["A1", "A2", "A3"];

function newExercise(): InlineExercise {
  return {
    id: crypto.randomUUID(),
    name: "",
    exercise_id: undefined,
    sets: 3,
    reps_min: 8,
    reps_max: 12,
  };
}

export function StrengthBlockEditor({ value, onChange }: StrengthBlockEditorProps) {
  const [showNotes, setShowNotes] = useState(!!value.notes);
  const { i18n } = useTranslation();
  const { exercises: allExercises } = useExercises();
  const { search: searchFn, query: search, setQuery: setSearch } = useExerciseSearch(allExercises, { debounceMs: 150 });
  const [openPickerForId, setOpenPickerForId] = useState<string | null>(null);

  const update = (patch: Partial<StrengthSpec>) => onChange({ ...value, ...patch });

  const updateExercise = (id: string, patch: Partial<InlineExercise>) => {
    update({
      exercises: value.exercises.map((ex) =>
        ex.id === id ? { ...ex, ...patch } : ex
      ),
    });
  };

  const removeExercise = (id: string) => {
    update({ exercises: value.exercises.filter((ex) => ex.id !== id) });
  };

  const addExercise = () => {
    update({ exercises: [...value.exercises, newExercise()] });
  };

  return (
    <div className="space-y-4">
      {/* SECTION 1 — Format */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Format
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {FORMATS.map((f) => {
            const active = value.format === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => update({ format: f })}
                className={cn(
                  "h-10 px-3 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:border-primary/30"
                )}
              >
                {FORMAT_LABELS[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 — Exercises */}
      <div className="space-y-2">
        {value.exercises.map((ex) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            showGroup={value.format === "superset"}
            onChange={(patch) => updateExercise(ex.id, patch)}
            onDelete={() => removeExercise(ex.id)}
            isPickerOpen={openPickerForId === ex.id}
            onOpenPicker={() => setOpenPickerForId(ex.id)}
            onClosePicker={() => { setOpenPickerForId(null); setSearch(""); }}
            search={search}
            setSearch={setSearch}
            searchFn={searchFn}
            lang={i18n.language}
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          className="w-full h-10 text-xs"
          onClick={addExercise}
        >
          ＋ Ajouter un exercice
        </Button>
      </div>

      {/* SECTION 3 — Format-specific */}
      <FormatFields value={value} update={update} />

      {/* SECTION 4 — Notes */}
      <div>
        <button
          type="button"
          onClick={() => setShowNotes((s) => !s)}
          className="text-xs text-primary font-medium"
        >
          {showNotes ? "− Masquer notes" : "＋ Notes"}
        </button>
        {showNotes && (
          <Textarea
            rows={2}
            placeholder="Intention, scaling, consignes…"
            className="mt-2 text-sm"
            value={value.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}

// ─── Exercise row ───────────────────────────────────────────────
function ExerciseRow({
  exercise,
  showGroup,
  onChange,
  onDelete,
  isPickerOpen,
  onOpenPicker,
  onClosePicker,
  search,
  setSearch,
  searchFn,
  lang,
}: {
  exercise: InlineExercise;
  showGroup: boolean;
  onChange: (patch: Partial<InlineExercise>) => void;
  onDelete: () => void;
  isPickerOpen: boolean;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  search: string;
  setSearch: (s: string) => void;
  searchFn: (q: string) => any[];
  lang: string;
}) {
  const [showDetails, setShowDetails] = useState(
    !!(exercise.suggested_weight || exercise.rpe_target || exercise.tempo || exercise.notes)
  );

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {isPickerOpen ? (
            <div className="space-y-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un exercice…"
                  className="pl-10 pr-9 h-10 text-sm"
                />
                <button
                  type="button"
                  onClick={onClosePicker}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {search.length > 0 && (
                <div className="rounded-lg border border-border bg-popover max-h-64 overflow-y-auto">
                  {searchFn(search).slice(0, 8).map((result: any) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        onChange({
                          exercise_id: result.id,
                          name: getExerciseName(result),
                          muscle_group: result.muscle_group,
                        });
                        onClosePicker();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getExerciseName(result)}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {result.muscle_group} · {result.equipment}
                        </p>
                      </div>
                    </button>
                  ))}
                  {searchFn(search).length === 0 && (
                    <p className="px-3 py-3 text-xs text-muted-foreground">
                      Aucun résultat
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenPicker}
              className="w-full flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-card hover:border-primary/40 text-left transition-colors"
            >
              {exercise.name ? (
                <>
                  <span className="text-sm font-semibold truncate flex-1 min-w-0">
                    {exercise.name}
                  </span>
                  {exercise.muscle_group && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {exercise.muscle_group}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Choisir un exercice...
                  </span>
                </>
              )}
            </button>
          )}
        </div>
        {showGroup && (
          <div className="flex gap-1">
            {GROUPS.map((g) => {
              const active = exercise.group === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    onChange({ group: active ? undefined : g })
                  }
                  className={cn(
                    "h-10 w-10 rounded-md text-[11px] font-semibold tabular-nums border transition",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="h-10 w-10 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          aria-label="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-end gap-2 flex-wrap">
        <NumField
          label="Séries"
          width="w-14"
          value={exercise.sets}
          onChange={(n) => onChange({ sets: n })}
        />
        <NumField
          label="Reps min"
          width="w-14"
          value={exercise.reps_min}
          onChange={(n) => onChange({ reps_min: n })}
        />
        <span className="pb-2.5 text-muted-foreground">–</span>
        <NumField
          label="Reps max"
          width="w-14"
          value={exercise.reps_max}
          onChange={(n) => onChange({ reps_max: n })}
        />
        <NumField
          label="Repos (s)"
          width="w-16"
          value={exercise.rest_s}
          onChange={(n) => onChange({ rest_s: n })}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowDetails((s) => !s)}
        className="text-[11px] text-primary font-medium"
      >
        {showDetails ? "− Détails" : "＋ Détails"}
      </button>

      {showDetails && (
        <div className="space-y-2 pt-1">
          <div className="flex items-end gap-2 flex-wrap">
            <NumField
              label="Charge (kg)"
              width="w-20"
              value={exercise.suggested_weight}
              onChange={(n) => onChange({ suggested_weight: n })}
            />
            <NumField
              label="RPE"
              width="w-14"
              value={exercise.rpe_target}
              max={10}
              onChange={(n) => onChange({ rpe_target: n })}
            />
            <div className="flex-1 min-w-[80px]">
              <label className="text-[11px] font-medium text-muted-foreground">
                Tempo
              </label>
              <Input
                value={exercise.tempo ?? ""}
                onChange={(e) => onChange({ tempo: e.target.value || undefined })}
                placeholder="3-1-1-0"
                className="h-10 text-sm tabular-nums"
              />
            </div>
          </div>
          <Textarea
            rows={2}
            placeholder="Notes exercice…"
            className="text-sm"
            value={exercise.notes ?? ""}
            onChange={(e) => onChange({ notes: e.target.value || undefined })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Format-specific fields ───────────────────────────────────────
function FormatFields({
  value,
  update,
}: {
  value: StrengthSpec;
  update: (patch: Partial<StrengthSpec>) => void;
}) {
  if (value.format === "straight" || value.format === "superset") return null;

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
      {(value.format === "amrap" || value.format === "emom") && (
        <NumField
          label="Durée (min)"
          fullWidth
          value={
            value.duration_s ? Math.round(value.duration_s / 60) : undefined
          }
          onChange={(n) => update({ duration_s: n ? n * 60 : undefined })}
        />
      )}
      {(value.format === "amrap" || value.format === "for_time" || value.format === "emom") && (
        <NumField
          label="Time cap (min)"
          fullWidth
          value={
            value.time_cap_s ? Math.round(value.time_cap_s / 60) : undefined
          }
          onChange={(n) => update({ time_cap_s: n ? n * 60 : undefined })}
        />
      )}
      {value.format === "for_time" && (
        <div>
          <label className="text-[11px] font-medium text-muted-foreground">
            Notes scaling
          </label>
          <Textarea
            rows={2}
            placeholder="Options de scaling…"
            className="text-sm mt-1"
            value={value.scaling_notes ?? ""}
            onChange={(e) =>
              update({ scaling_notes: e.target.value || undefined })
            }
          />
        </div>
      )}
      {value.format === "rounds" && (
        <NumField
          label="Nombre de rounds"
          fullWidth
          value={value.rounds}
          onChange={(n) => update({ rounds: n })}
        />
      )}
    </div>
  );
}

// ─── Tiny num field ─────────────────────────────────────────────
function NumField({
  label,
  value,
  onChange,
  width,
  fullWidth,
  max,
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  width?: string;
  fullWidth?: boolean;
  max?: number;
}) {
  const [local, setLocal] = useState<string>(value?.toString() ?? "");
  return (
    <div className={fullWidth ? "w-full" : width}>
      <label className="text-[11px] font-medium text-muted-foreground block">
        {label}
      </label>
      <Input
        type="number"
        inputMode="numeric"
        className="h-10 text-sm tabular-nums"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local === "") return onChange(undefined);
          let n = parseInt(local, 10);
          if (isNaN(n) || n < 0) return onChange(undefined);
          if (max && n > max) n = max;
          onChange(n);
          setLocal(n.toString());
        }}
      />
    </div>
  );
}