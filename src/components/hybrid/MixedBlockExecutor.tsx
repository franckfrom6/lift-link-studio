import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HybridBlock, MixedSubLog, SubBlock } from "@/types/hybrid";
import { cn } from "@/lib/utils";

interface MixedBlockExecutorProps {
  block: HybridBlock;
  blockIndex: number;
  totalBlocks: number;
  onComplete: (log: MixedSubLog[]) => void;
  onSkip: (reason?: string) => void;
}

function mmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function defaultValue(sb: SubBlock): string {
  if (sb.type === "cardio" && sb.cardio?.target_distance_m) return String(sb.cardio.target_distance_m);
  if (sb.type === "strength" && sb.exercise) {
    if (sb.exercise.target_distance_m) return String(sb.exercise.target_distance_m);
    if (sb.exercise.target_reps) return String(sb.exercise.target_reps);
    return String(sb.exercise.reps_max ?? sb.exercise.reps_min ?? "");
  }
  return "";
}

export default function MixedBlockExecutor({
  block,
  blockIndex,
  totalBlocks,
  onComplete,
  onSkip,
}: MixedBlockExecutorProps) {
  const subBlocks = block.sub_blocks ?? [];
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  const [rows, setRows] = useState<Record<string, { done: boolean; value: string }>>(() => {
    const init: Record<string, { done: boolean; value: string }> = {};
    subBlocks.forEach((sb) => {
      init[sb.id] = { done: false, value: defaultValue(sb) };
    });
    return init;
  });

  const [elapsed, setElapsed] = useState(0);
  const anchorRef = useRef<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - anchorRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, []);

  if (showSkip) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="px-4 pt-6 text-sm text-muted-foreground text-center">
          Bloc {blockIndex + 1} / {totalBlocks}
        </div>
        <div className="flex-1 px-6 py-8 space-y-4">
          <h2 className="text-xl font-bold">Passer ce bloc</h2>
          <Textarea
            placeholder="Motif du passage (optionnel)"
            rows={4}
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
          />
        </div>
        <div className="px-4 pb-8 space-y-3">
          <Button className="h-14 w-full" onClick={() => onSkip(skipReason.trim() || undefined)}>
            Confirmer
          </Button>
          <button
            className="block mx-auto text-sm text-muted-foreground underline"
            onClick={() => setShowSkip(false)}
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{block.name || "Station mixte"}</div>
          <div className="text-xs text-muted-foreground">
            Bloc {blockIndex + 1}/{totalBlocks}
          </div>
        </div>
        <div className="text-2xl font-bold tabular-nums text-primary">{mmss(elapsed)}</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {subBlocks.map((sb) => {
          const row = rows[sb.id] ?? { done: false, value: "" };
          const emoji = sb.type === "cardio" ? "🏃" : "💪";
          return (
            <div
              key={sb.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border bg-card transition-opacity",
                row.done && "opacity-70",
              )}
            >
              <button
                aria-label="toggle done"
                onClick={() =>
                  setRows((p) => ({ ...p, [sb.id]: { ...row, done: !row.done } }))
                }
                className={cn(
                  "h-11 w-11 rounded-lg border-2 flex items-center justify-center shrink-0 transition",
                  row.done
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-muted-foreground/30",
                )}
              >
                {row.done && <Check className="h-5 w-5" />}
              </button>
              <div className="text-2xl shrink-0">{emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{sb.label}</div>
              </div>
              <Input
                type="number"
                inputMode="numeric"
                value={row.value}
                onChange={(e) =>
                  setRows((p) => ({ ...p, [sb.id]: { ...row, value: e.target.value } }))
                }
                className="h-11 w-20 text-center tabular-nums"
              />
            </div>
          );
        })}
      </div>

      <div className="border-t bg-background px-4 py-3 space-y-2">
        <Button
          className="h-14 w-full text-base font-bold"
          onClick={() => {
            const log: MixedSubLog[] = subBlocks.map((sb) => {
              const r = rows[sb.id];
              const num = Number(r?.value);
              return {
                sub_block_id: sb.id,
                done: !!r?.done,
                actual_value: Number.isFinite(num) && num > 0 ? num : undefined,
              };
            });
            onComplete(log);
          }}
        >
          Valider le bloc →
        </Button>
        <button
          className="block mx-auto text-sm text-muted-foreground underline"
          onClick={() => setShowSkip(true)}
        >
          Passer ce bloc →
        </button>
      </div>
    </div>
  );
}
