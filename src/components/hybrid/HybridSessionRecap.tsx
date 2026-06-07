import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BLOCK_TYPE_ICONS,
  BlockExecution,
  HybridBlock,
  SENSATION_CONFIG,
  SensationTag,
  formatDuration,
} from "@/types/hybrid";
import { cn } from "@/lib/utils";

interface HybridSessionRecapProps {
  session: { id: string; name: string; hybrid_blocks: HybridBlock[] };
  blockExecutions: BlockExecution[];
  elapsedSeconds: number;
  onSave: (
    globalRpe: number | null,
    sensation: SensationTag | null,
    notes: string,
  ) => Promise<void>;
}

function shortBlockResult(block: HybridBlock, exec: BlockExecution): string {
  if (exec.status === "skipped") return "Passé";
  if (exec.cardio_log) {
    const parts: string[] = [];
    if (exec.cardio_log.actual_distance_m) {
      const km = exec.cardio_log.actual_distance_m / 1000;
      parts.push(km >= 1 ? `${km.toFixed(2)} km` : `${exec.cardio_log.actual_distance_m} m`);
    }
    if (exec.cardio_log.actual_duration_s) {
      parts.push(formatDuration(exec.cardio_log.actual_duration_s));
    }
    if (exec.cardio_log.actual_rpe) parts.push(`RPE ${exec.cardio_log.actual_rpe}`);
    return parts.join(" · ") || "Terminé";
  }
  if (exec.strength_log && exec.strength_log.length) {
    const top = exec.strength_log.find((s) => s.weight);
    const sets = exec.strength_log.length;
    const reps = exec.strength_log[0]?.reps;
    if (top?.weight) return `${sets}×${reps} @ ${top.weight} kg`;
    return `${sets} séries`;
  }
  if (exec.mixed_log) {
    const done = exec.mixed_log.filter((m) => m.done).length;
    return `${done} / ${exec.mixed_log.length} mini-blocs`;
  }
  return "Terminé";
}

export default function HybridSessionRecap({
  session,
  blockExecutions,
  elapsedSeconds,
  onSave,
}: HybridSessionRecapProps) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [sensation, setSensation] = useState<SensationTag | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.3 } });
    } catch {}
  }, []);

  const blocks = session.hybrid_blocks;
  const completed = blockExecutions.filter((b) => b.status !== "skipped").length;
  const cardioRpes = blockExecutions
    .map((b) => b.cardio_log?.actual_rpe)
    .filter((r): r is number => typeof r === "number");
  const avgRpe = cardioRpes.length
    ? Math.round((cardioRpes.reduce((a, b) => a + b, 0) / cardioRpes.length) * 10) / 10
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 max-w-2xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Séance terminée 🎉</h1>
          <p className="text-sm text-muted-foreground truncate">{session.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border bg-card p-3 text-center">
            <div className="text-xs text-muted-foreground">Chrono</div>
            <div className="text-lg font-bold tabular-nums">{formatDuration(elapsedSeconds)}</div>
          </div>
          <div className="rounded-xl border bg-card p-3 text-center">
            <div className="text-xs text-muted-foreground">Blocs</div>
            <div className="text-lg font-bold tabular-nums">
              {completed}/{blocks.length}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-3 text-center">
            <div className="text-xs text-muted-foreground">RPE moy.</div>
            <div className="text-lg font-bold tabular-nums">{avgRpe ?? "—"}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Détail</div>
          {blocks.map((b, i) => {
            const exec = blockExecutions[i];
            if (!exec) return null;
            const skipped = exec.status === "skipped";
            return (
              <div
                key={b.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card"
              >
                <div className="text-lg shrink-0">{BLOCK_TYPE_ICONS[b.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{b.name || `Bloc ${i + 1}`}</div>
                </div>
                <div
                  className={cn(
                    "text-xs px-2 py-1 rounded-md shrink-0 font-medium",
                    skipped
                      ? "bg-muted text-muted-foreground"
                      : "bg-green-500/15 text-green-600",
                  )}
                >
                  {skipped ? "⏭ Skip" : "✓"}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums hidden xs:block truncate max-w-[40%]">
                  {shortBlockResult(b, exec)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Comment s'est passée cette séance ?</h2>

          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">RPE global</div>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }).map((_, i) => {
                const n = i + 1;
                const active = rpe === n;
                return (
                  <button
                    key={n}
                    onClick={() => setRpe(n)}
                    className={cn(
                      "h-11 rounded-md border text-sm font-semibold tabular-nums transition",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card hover:bg-accent",
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Sensation</div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SENSATION_CONFIG) as SensationTag[]).map((tag) => {
                const cfg = SENSATION_CONFIG[tag];
                const active = sensation === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSensation(tag)}
                    className={cn(
                      "h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition",
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    <div className="text-2xl">{cfg.emoji}</div>
                    <div className="text-sm font-semibold">{cfg.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Notes pour le coach
            </div>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ressenti, douleurs, contexte…"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-background border-t p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            className="h-14 w-full text-base font-bold"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(rpe, sensation, notes.trim());
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Enregistrement…" : "Valider la séance"}
          </Button>
        </div>
      </div>
    </div>
  );
}
