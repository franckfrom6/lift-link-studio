import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  HybridBlock,
  HybridBlockType,
  HYBRID_TEMPLATES,
  BLOCK_TYPE_LABELS,
  BLOCK_TYPE_ICONS,
  BLOCK_TYPE_COLORS,
  MODALITY_ICONS,
  blockSummary,
  estimatedSessionDuration,
  SubBlock,
  CardioSpec,
  StrengthSpec,
  InlineExercise,
} from "@/types/hybrid";
import { CardioBlockEditor } from "./CardioBlockEditor";
import { StrengthBlockEditor } from "./StrengthBlockEditor";

interface HybridSessionBuilderProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  onSave: (name: string, blocks: HybridBlock[]) => Promise<void>;
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);

const ADD_OPTIONS: HybridBlockType[] = [
  "warmup", "cardio", "strength", "mixed", "cooldown",
];

function defaultCardio(): CardioSpec {
  return { modality: "run", mode: "distance", target_distance_m: 1000 };
}
function defaultStrength(): StrengthSpec {
  return { format: "straight", exercises: [] };
}

function newBlock(type: HybridBlockType): HybridBlock {
  const id = uid();
  if (type === "strength") {
    return { id, type, name: "Force", strength: defaultStrength() };
  }
  if (type === "mixed") {
    return { id, type, name: "Station mixte", sub_blocks: [] };
  }
  if (type === "warmup") {
    return {
      id, type, name: "Échauffement",
      cardio: { modality: "run", mode: "time", target_duration_s: 600, target_zone: 1 },
    };
  }
  if (type === "cooldown") {
    return {
      id, type, name: "Retour au calme",
      cardio: { modality: "walk", mode: "time", target_duration_s: 300, target_zone: 1 },
    };
  }
  return { id, type: "cardio", name: "Cardio", cardio: defaultCardio() };
}

function templateToBlocks(tplBlocks: Omit<HybridBlock, "id">[]): HybridBlock[] {
  return tplBlocks.map((b) => ({ ...b, id: uid() }));
}

export function HybridSessionBuilder({
  open,
  onClose,
  date,
  onSave,
}: HybridSessionBuilderProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [blocks, setBlocks] = useState<HybridBlock[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset on close/open
  useEffect(() => {
    if (open) {
      setStep(1);
      setName("");
      setBlocks([]);
      setExpandedId(null);
      setAddOpen(false);
      setSaving(false);
    }
  }, [open]);

  const totalMin = useMemo(
    () => Math.round(estimatedSessionDuration(blocks) / 60),
    [blocks]
  );

  const handleTemplate = (tplId: string) => {
    const tpl = HYBRID_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setBlocks(templateToBlocks(tpl.blocks));
    if (!name) setName(tpl.name);
  };

  const updateBlock = (id: string, patch: Partial<HybridBlock>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const removeBlock = (id: string) =>
    setBlocks((bs) => bs.filter((b) => b.id !== id));

  const addBlock = (type: HybridBlockType) => {
    const b = newBlock(type);
    setBlocks((bs) => [...bs, b]);
    setExpandedId(b.id);
    setAddOpen(false);
  };

  const handleSave = async () => {
    if (!name.trim() || blocks.length === 0 || hasUnnamedExercise) return;
    setSaving(true);
    try {
      await onSave(name.trim(), blocks);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const hasUnnamedExercise = blocks.some(
    (b) => b.strength?.exercises.some((e) => !e.name)
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 h-[95dvh] flex flex-col"
      >
        {step === 1 ? (
          <Step1
            name={name}
            setName={setName}
            date={date}
            onTemplate={(id) => {
              handleTemplate(id);
              setStep(2);
            }}
            onBlank={() => {
              setBlocks([]);
              setStep(2);
            }}
            onContinue={() => setStep(2)}
          />
        ) : (
          <Step2
            name={name}
            setName={setName}
            blocks={blocks}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            updateBlock={updateBlock}
            removeBlock={removeBlock}
            totalMin={totalMin}
            onBack={() => setStep(1)}
            onAddClick={() => setAddOpen(true)}
            onSave={handleSave}
            saving={saving}
            hasUnnamedExercise={hasUnnamedExercise}
          />
        )}
      </SheetContent>

      {/* Add-block mini sheet */}
      <Sheet open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-6">
          <p className="text-base font-semibold mb-3">Ajouter un bloc</p>
          <div className="grid grid-cols-2 gap-2.5">
            {ADD_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addBlock(t)}
                className="h-24 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl" aria-hidden>
                  {BLOCK_TYPE_ICONS[t]}
                </span>
                <span className="text-xs font-semibold">
                  {BLOCK_TYPE_LABELS[t]}
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </Sheet>
  );
}

// ─── Step 1 ─────────────────────────────────────────────────────
function Step1({
  name, setName, date, onTemplate, onBlank, onContinue,
}: {
  name: string;
  setName: (s: string) => void;
  date: Date;
  onTemplate: (id: string) => void;
  onBlank: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <p className="text-xs text-muted-foreground">
          {date.toLocaleDateString("fr", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </p>
        <h2 className="text-lg font-bold">Nouvelle séance hybride</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            Nom de la séance
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. Hyrox Prep, Conditioning Lundi…"
            className="h-11 mt-1.5"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Partir d'un template
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
            {HYBRID_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onTemplate(tpl.id)}
                className="min-w-[200px] h-24 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition p-3 text-left flex flex-col justify-between shrink-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-3xl leading-none">{tpl.icon}</span>
                  <span className="font-semibold text-sm truncate">{tpl.name}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {tpl.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onBlank}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ou commencer vide →
        </button>
      </div>

      <div className="px-5 py-3 border-t border-border bg-background">
        <Button
          type="button"
          className="w-full h-11"
          disabled={!name.trim()}
          onClick={onContinue}
        >
          Continuer →
        </Button>
      </div>
    </>
  );
}

// ─── Step 2 ─────────────────────────────────────────────────────
function Step2({
  name, setName, blocks, expandedId, setExpandedId,
  updateBlock, removeBlock, totalMin, onBack, onAddClick, onSave, saving, hasUnnamedExercise,
}: {
  name: string;
  setName: (s: string) => void;
  blocks: HybridBlock[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  updateBlock: (id: string, patch: Partial<HybridBlock>) => void;
  removeBlock: (id: string) => void;
  totalMin: number;
  onBack: () => void;
  onAddClick: () => void;
  onSave: () => void;
  saving: boolean;
  hasUnnamedExercise: boolean;
}) {
  return (
    <>
      {/* Sticky sub-header */}
      <div className="px-4 py-3 border-b border-border bg-background flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Retour"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{name || "Sans nom"}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {blocks.length} bloc{blocks.length > 1 ? "s" : ""} · ~{totalMin} min
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {blocks.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Aucun bloc. Ajoute le premier ↓
          </p>
        )}

        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            expanded={expandedId === block.id}
            onToggle={() =>
              setExpandedId(expandedId === block.id ? null : block.id)
            }
            onChange={(patch) => updateBlock(block.id, patch)}
            onDelete={() => removeBlock(block.id)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full h-11"
          onClick={onAddClick}
        >
          ＋ Ajouter un bloc
        </Button>
      </div>

      <div className="px-4 py-3 border-t border-border bg-background flex items-center gap-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          ~{totalMin} min
        </p>
        <Button
          type="button"
          className="flex-1 h-11"
          disabled={saving || blocks.length === 0 || !name.trim() || hasUnnamedExercise}
          onClick={onSave}
        >
          {saving ? "Enregistrement…" : hasUnnamedExercise ? "Choisis tous les exercices" : "Enregistrer la séance"}
        </Button>
      </div>
    </>
  );
}

// ─── Block card ─────────────────────────────────────────────────
function BlockCard({
  block, expanded, onToggle, onChange, onDelete,
}: {
  block: HybridBlock;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<HybridBlock>) => void;
  onDelete: () => void;
}) {
  const [localName, setLocalName] = useState(block.name ?? "");

  useEffect(() => {
    setLocalName(block.name ?? "");
  }, [block.name]);

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-8 px-2 inline-flex items-center gap-1 rounded-md border text-[11px] font-semibold shrink-0",
              BLOCK_TYPE_COLORS[block.type]
            )}
          >
            <span>{BLOCK_TYPE_ICONS[block.type]}</span>
            <span>{BLOCK_TYPE_LABELS[block.type]}</span>
          </span>
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={() => onChange({ name: localName })}
            placeholder="Nom du bloc"
            className="h-9 text-sm font-semibold flex-1 min-w-0"
          />
          <button
            type="button"
            onClick={onToggle}
            className="h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={expanded ? "Réduire" : "Développer"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {!expanded && (
          <p className="text-xs text-muted-foreground pl-1 truncate">
            {blockSummary(block)}
          </p>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border p-3">
          {(block.type === "cardio" ||
            block.type === "warmup" ||
            block.type === "cooldown") && (
            <CardioBlockEditor
              value={block.cardio ?? defaultCardio()}
              onChange={(cardio) => onChange({ cardio })}
            />
          )}
          {block.type === "strength" && (
            <StrengthBlockEditor
              value={block.strength ?? defaultStrength()}
              onChange={(strength) => onChange({ strength })}
            />
          )}
          {block.type === "mixed" && (
            <MixedBlockEditorInline
              subBlocks={block.sub_blocks ?? []}
              onChange={(sub_blocks) => onChange({ sub_blocks })}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mixed editor (inline) ──────────────────────────────────────
function MixedBlockEditorInline({
  subBlocks,
  onChange,
}: {
  subBlocks: SubBlock[];
  onChange: (next: SubBlock[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const update = (id: string, patch: Partial<SubBlock>) =>
    onChange(subBlocks.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const remove = (id: string) =>
    onChange(subBlocks.filter((s) => s.id !== id));

  const swap = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= subBlocks.length) return;
    const next = [...subBlocks];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  const addSub = (type: "cardio" | "strength") => {
    const id = uid();
    if (type === "cardio") {
      onChange([
        ...subBlocks,
        {
          id, type, label: "Cardio",
          cardio: { modality: "run", mode: "distance", target_distance_m: 200 },
        },
      ]);
    } else {
      const ex: InlineExercise & { target_reps?: number } = {
        id: uid(),
        name: "",
        sets: 1,
        reps_min: 10,
        reps_max: 10,
        target_reps: 10,
      };
      onChange([
        ...subBlocks,
        { id, type, label: "Force", exercise: ex },
      ]);
    }
    setPickerOpen(false);
  };

  return (
    <div className="space-y-2">
      {subBlocks.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3">
          Aucun mini-bloc
        </p>
      )}

      {subBlocks.map((sub, idx) => (
        <SubBlockRow
          key={sub.id}
          sub={sub}
          first={idx === 0}
          last={idx === subBlocks.length - 1}
          onUp={() => swap(idx, -1)}
          onDown={() => swap(idx, 1)}
          onChange={(patch) => update(sub.id, patch)}
          onDelete={() => remove(sub.id)}
        />
      ))}

      {!pickerOpen ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full h-10 text-xs"
          onClick={() => setPickerOpen(true)}
        >
          ＋ Ajouter mini-bloc
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => addSub("cardio")}
          >
            🏃 Cardio
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => addSub("strength")}
          >
            💪 Force
          </Button>
        </div>
      )}
    </div>
  );
}

function SubBlockRow({
  sub, first, last, onUp, onDown, onChange, onDelete,
}: {
  sub: SubBlock;
  first: boolean;
  last: boolean;
  onUp: () => void;
  onDown: () => void;
  onChange: (patch: Partial<SubBlock>) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(sub.label);
  const icon =
    sub.type === "cardio"
      ? MODALITY_ICONS[sub.cardio?.modality ?? "run"]
      : "💪";

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-2">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={onUp}
          disabled={first}
          className="h-5 w-5 inline-flex items-center justify-center text-muted-foreground disabled:opacity-30"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDown}
          disabled={last}
          className="h-5 w-5 inline-flex items-center justify-center text-muted-foreground disabled:opacity-30"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>
      <span className="text-lg shrink-0">{icon}</span>
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => onChange({ label })}
        placeholder="Libellé"
        className="h-9 text-sm flex-1 min-w-0"
      />
      {sub.type === "cardio" ? (
        <SubCardioInput sub={sub} onChange={onChange} />
      ) : (
        <SubStrengthInput sub={sub} onChange={onChange} />
      )}
      <button
        type="button"
        onClick={onDelete}
        className="h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:text-destructive rounded-md"
        aria-label="Supprimer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SubCardioInput({
  sub,
  onChange,
}: {
  sub: SubBlock;
  onChange: (patch: Partial<SubBlock>) => void;
}) {
  const c = sub.cardio ?? { modality: "run" as const, mode: "distance" as const };
  const isTime = c.mode === "time";
  const [v, setV] = useState<string>(
    isTime
      ? c.target_duration_s
        ? String(Math.round(c.target_duration_s / 60))
        : ""
      : c.target_distance_m
      ? String(c.target_distance_m)
      : ""
  );

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        inputMode="numeric"
        className="h-9 w-16 text-xs tabular-nums"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = parseInt(v, 10);
          if (isTime) {
            onChange({
              cardio: {
                ...c,
                mode: "time",
                target_duration_s: isNaN(n) ? undefined : n * 60,
                target_distance_m: undefined,
              },
            });
          } else {
            onChange({
              cardio: {
                ...c,
                mode: "distance",
                target_distance_m: isNaN(n) ? undefined : n,
                target_duration_s: undefined,
              },
            });
          }
        }}
      />
      <button
        type="button"
        onClick={() =>
          onChange({
            cardio: {
              ...c,
              mode: isTime ? "distance" : "time",
              target_distance_m: isTime ? c.target_distance_m : undefined,
              target_duration_s: isTime ? undefined : c.target_duration_s,
            },
          })
        }
        className="h-9 px-2 text-[10px] font-semibold text-muted-foreground border border-border rounded"
      >
        {isTime ? "min" : "m"}
      </button>
    </div>
  );
}

function SubStrengthInput({
  sub,
  onChange,
}: {
  sub: SubBlock;
  onChange: (patch: Partial<SubBlock>) => void;
}) {
  const ex = sub.exercise;
  const reps = ex?.target_reps ?? ex?.reps_max ?? 0;
  const [v, setV] = useState<string>(reps ? String(reps) : "");

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        inputMode="numeric"
        className="h-9 w-14 text-xs tabular-nums"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = parseInt(v, 10);
          if (isNaN(n)) return;
          onChange({
            exercise: {
              ...(ex ?? { id: uid(), name: "", sets: 1, reps_min: n, reps_max: n }),
              reps_min: n,
              reps_max: n,
              target_reps: n,
            },
          });
        }}
      />
      <span className="text-[10px] font-semibold text-muted-foreground">reps</span>
    </div>
  );
}