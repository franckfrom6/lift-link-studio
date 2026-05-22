import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import {
  RunBlock,
  RunBlockType,
  RUN_BLOCK_LABELS,
  RUN_BLOCK_COLORS,
  ZONE_LABELS,
  totalBlocksKm,
  estimatedBlocksMin,
} from "@/types/running";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RunBlockEditorProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  initialBlocks?: RunBlock[];
  sessionName?: string;
  onSave: (name: string, blocks: RunBlock[]) => Promise<void>;
}

const BLOCK_TYPES: RunBlockType[] = [
  "warmup", "easy", "tempo", "threshold", "interval", "recovery", "cooldown",
];

const newId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2));

const blockDefaults = (type: RunBlockType): RunBlock => {
  const base: RunBlock = { id: newId(), type };
  switch (type) {
    case "warmup":    return { ...base, target_min: 10, zone: 1 };
    case "easy":      return { ...base, target_min: 30, zone: 2 };
    case "tempo":     return { ...base, target_min: 20, zone: 3 };
    case "threshold": return { ...base, target_min: 15, zone: 4 };
    case "interval":  return { ...base, repeats: 8, work_km: 0.2, recovery_min: 1, zone: 5 };
    case "recovery":  return { ...base, target_min: 10, zone: 1 };
    case "cooldown":  return { ...base, target_min: 10, zone: 1 };
  }
};

const TEMPLATES: Record<string, () => RunBlock[]> = {
  "Footing facile": () => [
    { id: newId(), type: "warmup", target_min: 10, zone: 1 },
    { id: newId(), type: "easy", target_min: 30, zone: 2 },
    { id: newId(), type: "cooldown", target_min: 5, zone: 1 },
  ],
  "Tempo run": () => [
    { id: newId(), type: "warmup", target_min: 10, zone: 1 },
    { id: newId(), type: "tempo", target_min: 20, zone: 3 },
    { id: newId(), type: "cooldown", target_min: 10, zone: 1 },
  ],
  "Fractionné court": () => [
    { id: newId(), type: "warmup", target_min: 15, zone: 1 },
    { id: newId(), type: "interval", repeats: 8, work_km: 0.2, recovery_min: 1, zone: 5 },
    { id: newId(), type: "cooldown", target_min: 10, zone: 1 },
  ],
  "Sortie longue": () => [
    { id: newId(), type: "warmup", target_min: 10, zone: 1 },
    { id: newId(), type: "easy", target_min: 60, zone: 2 },
    { id: newId(), type: "cooldown", target_min: 10, zone: 1 },
  ],
};

/** mm:ss <-> seconds */
const secToMmss = (s?: number) => {
  if (!s || s <= 0) return "";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};
const mmssToSec = (v: string): number | undefined => {
  if (!v) return undefined;
  const m = v.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return undefined;
  const sec = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return sec > 0 ? sec : undefined;
};

const RunBlockEditor = ({
  open,
  onClose,
  initialBlocks,
  sessionName,
  onSave,
}: RunBlockEditorProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(sessionName ?? "");
  const [blocks, setBlocks] = useState<RunBlock[]>(initialBlocks ?? []);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voltDescription, setVoltDescription] = useState("");
  const [voltParsing, setVoltParsing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setName(sessionName ?? "");
      setBlocks(initialBlocks ?? []);
      setStep((initialBlocks?.length ?? 0) > 0 ? 2 : 1);
    }
  }, [open, sessionName, initialBlocks]);

  const totalKm = useMemo(() => totalBlocksKm(blocks), [blocks]);
  const totalMin = useMemo(() => estimatedBlocksMin(blocks), [blocks]);

  const applyTemplate = (key: string) => {
    setBlocks(TEMPLATES[key]());
    if (!name) setName(key);
  };

  const updateBlock = (id: string, patch: Partial<RunBlock>) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
  };
  const removeBlock = (id: string) =>
    setBlocks(prev => prev.filter(b => b.id !== id));
  const addBlock = (type: RunBlockType) => {
    setBlocks(prev => [...prev, blockDefaults(type)]);
    setPickerOpen(false);
  };

  const handleSave = async () => {
    if (!blocks.length || !name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), blocks);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleVoltParse = async () => {
    if (!voltDescription.trim()) return;
    setVoltParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: {
          message: `Parse cette description de séance running en blocs JSON. Réponds UNIQUEMENT avec un tableau JSON valide de RunBlock, sans texte autour. Types disponibles: warmup, easy, tempo, threshold, interval, recovery, cooldown. Chaque objet doit avoir: id (uuid), type, et soit target_km soit target_min (nombre). Optionnel: zone (1-5), pace_min_s, pace_max_s, repeats, work_km, recovery_min, notes. Description: "${voltDescription}"`,
          userId: user?.id,
          parseMode: true,
        },
      });
      if (error) throw error;
      const raw = data?.result?.message || data?.message || "";
      const match = typeof raw === "string" ? raw.match(/\[[\s\S]*\]/) : null;
      if (match) {
        const parsed = JSON.parse(match[0]) as RunBlock[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const withIds = parsed.map(b => ({ ...b, id: b.id || newId() }));
          setBlocks(withIds);
          setStep(2);
          setVoltDescription("");
        } else {
          toast.error("Impossible de parser la description. Essaie les templates !");
        }
      } else {
        toast.error("Réponse inattendue. Utilise les templates ou crée manuellement.");
      }
    } catch {
      toast.error("Erreur de connexion avec VOLT");
    } finally {
      setVoltParsing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="h-[92dvh] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <SheetTitle className="text-base">
            {step === 1 ? "Nouvelle séance running" : name || "Séance running"}
          </SheetTitle>
        </SheetHeader>

        {step === 1 ? (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="run-name">Nom de la séance</Label>
              <Input
                id="run-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Footing 8km, Fractionné 10×400m…"
                className="h-12"
              />
            </div>

            {blocks.length === 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Modèles rapides</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(TEMPLATES).map(key => (
                    <button
                      key={key}
                      onClick={() => applyTemplate(key)}
                      className="min-h-[56px] rounded-lg border border-border bg-card px-3 py-2 text-left text-sm hover:bg-accent transition"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                décris ta séance en quelques mots
              </p>
              <textarea
                value={voltDescription}
                onChange={e => setVoltDescription(e.target.value)}
                placeholder="ex. 10 min échauffement, 30 min footing EF, 5 min retour au calme"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:border-primary/60"
              />
              <Button
                variant="outline"
                disabled={!voltDescription.trim() || voltParsing}
                onClick={handleVoltParse}
                className="w-full"
              >
                {voltParsing ? "Analyse en cours…" : "✨ Générer les blocs"}
              </Button>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full h-12"
              >
                Continuer →
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {blocks.map((b) => (
              <BlockCard
                key={b.id}
                block={b}
                onChange={patch => updateBlock(b.id, patch)}
                onDelete={() => removeBlock(b.id)}
              />
            ))}

            <button
              onClick={() => setPickerOpen(true)}
              className="w-full min-h-[48px] rounded-lg border border-dashed border-border bg-card/50 hover:bg-accent transition flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Plus className="w-4 h-4" />
              Ajouter un bloc
            </button>

            {blocks.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Aucun bloc. Ajoutez-en un pour commencer.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3 bg-background">
            <div className="text-sm tabular-nums">
              <span className="font-semibold">{totalKm.toFixed(1)} km</span>
              <span className="text-muted-foreground"> · ~{Math.round(totalMin)} min</span>
            </div>
            <Button
              onClick={handleSave}
              disabled={!blocks.length || !name.trim() || saving}
              className="h-11 min-w-[140px]"
            >
              {saving ? "…" : "Enregistrer"}
            </Button>
          </div>
        )}

        {/* Block type picker */}
        <Sheet open={pickerOpen} onOpenChange={v => !v && setPickerOpen(false)}>
          <SheetContent side="bottom" className="max-h-[60dvh]">
            <SheetHeader>
              <SheetTitle className="text-base">Type de bloc</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {BLOCK_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => addBlock(t)}
                  className={cn(
                    "min-h-[56px] rounded-lg border px-3 py-2 text-left text-sm font-medium transition hover:opacity-80",
                    RUN_BLOCK_COLORS[t],
                  )}
                >
                  {RUN_BLOCK_LABELS[t]}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </SheetContent>
    </Sheet>
  );
};

/* ---------------- Block card ---------------- */

interface BlockCardProps {
  block: RunBlock;
  onChange: (patch: Partial<RunBlock>) => void;
  onDelete: () => void;
}

const BlockCard = ({ block, onChange, onDelete }: BlockCardProps) => {
  const [paceMin, setPaceMin] = useState(secToMmss(block.pace_min_s));
  const [paceMax, setPaceMax] = useState(secToMmss(block.pace_max_s));
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setPaceMin(secToMmss(block.pace_min_s));
    setPaceMax(secToMmss(block.pace_max_s));
  }, [block.pace_min_s, block.pace_max_s]);

  const unit: "km" | "min" = block.target_km != null ? "km" : "min";

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium",
            RUN_BLOCK_COLORS[block.type],
          )}
        >
          {RUN_BLOCK_LABELS[block.type]}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onDelete}
            className="w-11 h-11 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
            aria-label="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Type chips */}
      <div className="flex flex-wrap gap-1.5">
        {BLOCK_TYPES.map(t => (
          <button
            key={t}
            onClick={() => onChange({ type: t })}
            className={cn(
              "min-h-[36px] px-3 rounded-full text-xs border transition",
              block.type === t
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-accent",
            )}
          >
            {RUN_BLOCK_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Target unit toggle + value */}
      {block.type !== "interval" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() =>
                onChange({ target_km: block.target_km ?? block.target_min ?? 5, target_min: undefined })
              }
              className={cn(
                "flex-1 min-h-[44px] rounded-md border text-sm font-medium transition",
                unit === "km"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-accent",
              )}
            >
              km
            </button>
            <button
              onClick={() =>
                onChange({ target_min: block.target_min ?? block.target_km ?? 10, target_km: undefined })
              }
              className={cn(
                "flex-1 min-h-[44px] rounded-md border text-sm font-medium transition",
                unit === "min"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-accent",
              )}
            >
              min
            </button>
          </div>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step={unit === "km" ? 0.1 : 1}
            value={unit === "km" ? block.target_km ?? "" : block.target_min ?? ""}
            onChange={e => {
              const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
              onChange(unit === "km" ? { target_km: v } : { target_min: v });
            }}
            className="h-11 tabular-nums"
            placeholder={unit === "km" ? "Distance (km)" : "Durée (min)"}
          />
        </div>
      )}

      {/* Interval-specific row */}
      {block.type === "interval" && (
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Répétitions</Label>
            <Input
              type="number"
              min={1}
              value={block.repeats ?? ""}
              onChange={e =>
                onChange({ repeats: e.target.value === "" ? undefined : parseInt(e.target.value, 10) })
              }
              className="h-11 tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dist. (m)</Label>
            <Input
              type="number"
              min={0}
              step={50}
              value={block.work_km != null ? Math.round(block.work_km * 1000) : ""}
              onChange={e => {
                const v = e.target.value === "" ? undefined : parseFloat(e.target.value) / 1000;
                onChange({ work_km: v, work_min: undefined });
              }}
              className="h-11 tabular-nums"
              placeholder="ou min ↓"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Récup (min)</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={block.recovery_min ?? ""}
              onChange={e =>
                onChange({
                  recovery_min: e.target.value === "" ? undefined : parseFloat(e.target.value),
                })
              }
              className="h-11 tabular-nums"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <Label className="text-xs text-muted-foreground">
              Ou durée de travail (min)
            </Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={block.work_min ?? ""}
              onChange={e =>
                onChange({
                  work_min: e.target.value === "" ? undefined : parseFloat(e.target.value),
                  work_km: e.target.value === "" ? block.work_km : undefined,
                })
              }
              className="h-11 tabular-nums"
            />
          </div>
        </div>
      )}

      {/* Pace range */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="text-xs text-muted-foreground flex items-center gap-1 mt-1"
      >
        {expanded ? "− Moins" : "＋ Allure / Zone / Notes"}
      </button>

      {expanded && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Allure min (mm:ss/km)</Label>
              <Input
                value={paceMin}
                onChange={e => setPaceMin(e.target.value)}
                onBlur={() => onChange({ pace_min_s: mmssToSec(paceMin) })}
                placeholder="6:30"
                className="h-11 tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Allure max (mm:ss/km)</Label>
              <Input
                value={paceMax}
                onChange={e => setPaceMax(e.target.value)}
                onBlur={() => onChange({ pace_max_s: mmssToSec(paceMax) })}
                placeholder="6:00"
                className="h-11 tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zone</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(z => (
                <button
                  key={z}
                  onClick={() => onChange({ zone: block.zone === z ? undefined : (z as 1 | 2 | 3 | 4 | 5) })}
                  className={cn(
                    "flex-1 min-h-[44px] rounded-md border text-xs font-semibold transition",
                    block.zone === z
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-accent",
                  )}
                  title={ZONE_LABELS[z]}
                >
                  Z{z}
                </button>
              ))}
            </div>
          </div>

          <Input
            value={block.notes ?? ""}
            onChange={e => onChange({ notes: e.target.value || undefined })}
            placeholder="Notes (optionnel)"
            className="h-11"
          />
        </div>
      )}
    </div>
  );
};

export default RunBlockEditor;