import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  CardioBlockLog,
  HybridBlock,
  MODALITY_ICONS,
  RPE_LABELS,
  formatDuration,
  formatPace,
} from "@/types/hybrid";

interface CardioBlockExecutorProps {
  block: HybridBlock;
  blockIndex: number;
  totalBlocks: number;
  onComplete: (log: CardioBlockLog) => void;
  onSkip: (reason?: string) => void;
}

type Phase = "ready" | "running" | "log" | "skip";

function targetSummary(block: HybridBlock): string {
  const c = block.cardio;
  if (!c) return "";
  if (c.mode === "distance" && c.target_distance_m) {
    const km = c.target_distance_m / 1000;
    const distStr = km >= 1 ? `${km.toFixed(1).replace(".", ",")} km` : `${c.target_distance_m} m`;
    return c.target_pace_s ? `${distStr} @ ${formatPace(c.target_pace_s)}` : distStr;
  }
  if (c.mode === "time" && c.target_duration_s) {
    return `${formatDuration(c.target_duration_s)}${c.target_zone ? ` Z${c.target_zone}` : ""}`;
  }
  if (c.mode === "intervals" && c.repeats && c.interval) {
    const work = c.interval.work_distance_m
      ? `${c.interval.work_distance_m}m`
      : formatDuration(c.interval.work_duration_s);
    return `${c.repeats} × ${work} récup ${formatDuration(c.interval.recovery_duration_s)}`;
  }
  return "";
}

function mmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function parseMmSs(v: string): number | undefined {
  const m = v.match(/^(\d+):(\d{1,2})$/);
  if (!m) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return Number(m[1]) * 60 + Number(m[2]);
}

export default function CardioBlockExecutor({
  block,
  blockIndex,
  totalBlocks,
  onComplete,
  onSkip,
}: CardioBlockExecutorProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const anchorRef = useRef<number>(0);
  const baseRef = useRef<number>(0);

  const targetDist =
    block.cardio?.mode === "distance" ? (block.cardio?.target_distance_m ?? 0) / 1000 : undefined;

  const [timeStr, setTimeStr] = useState("");
  const [distance, setDistance] = useState<string>(targetDist ? String(targetDist) : "");
  const [rpe, setRpe] = useState(7);
  const [note, setNote] = useState("");
  const [skipReason, setSkipReason] = useState("");

  useEffect(() => {
    if (phase !== "running" || paused) return;
    anchorRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(baseRef.current + Math.floor((Date.now() - anchorRef.current) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [phase, paused]);

  const modality = block.cardio?.modality ?? "other";
  const summary = targetSummary(block);

  if (phase === "ready") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="px-4 pt-6 text-center text-sm text-muted-foreground">
          Bloc {blockIndex + 1} / {totalBlocks}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="text-7xl">{MODALITY_ICONS[modality]}</div>
          <h1 className="text-2xl font-bold">{block.name || "Bloc cardio"}</h1>
          {summary && <p className="text-lg text-muted-foreground">{summary}</p>}
          {block.notes && (
            <p className="text-sm italic text-muted-foreground line-clamp-2 max-w-md">
              {block.notes}
            </p>
          )}
        </div>
        <div className="px-4 pb-8 space-y-3">
          <Button
            className="h-16 w-full text-base font-bold"
            onClick={() => {
              baseRef.current = 0;
              setElapsed(0);
              setPhase("running");
            }}
          >
            ▶ DÉMARRER
          </Button>
          <button
            className="block mx-auto text-sm text-muted-foreground underline"
            onClick={() => setPhase("log")}
          >
            Saisir directement →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="px-4 pt-4 flex items-center justify-between text-sm">
          <span className="font-semibold truncate">{block.name || "Bloc cardio"}</span>
          <span className="text-muted-foreground">
            Bloc {blockIndex + 1}/{totalBlocks}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="text-[72px] font-bold tabular-nums text-primary leading-none">
            {mmss(elapsed)}
          </div>
          {summary && <p className="text-sm text-muted-foreground text-center">{summary}</p>}
        </div>
        <div className="px-4 pb-8 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={() => {
                if (!paused) {
                  baseRef.current = elapsed;
                  setPaused(true);
                } else {
                  setPaused(false);
                }
              }}
            >
              {paused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={() => {
                setTimeStr(mmss(elapsed));
                setPhase("log");
              }}
            >
              <Square className="h-6 w-6" />
            </Button>
          </div>
          <button
            className="block mx-auto text-sm text-muted-foreground underline"
            onClick={() => setPhase("skip")}
          >
            Passer ce bloc →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "skip") {
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
            onClick={() => setPhase("ready")}
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="px-4 pt-6 text-sm text-muted-foreground text-center">
        Bloc {blockIndex + 1} / {totalBlocks} — {block.name || "Bloc cardio"}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Temps réalisé (min:sec)</label>
          <Input
            inputMode="numeric"
            placeholder="00:00"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            className="h-12 text-lg tabular-nums"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Distance réalisée (km)</label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="h-12 text-lg tabular-nums"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            RPE ressenti — <span className="text-primary">{rpe}</span>{" "}
            <span className="text-muted-foreground font-normal">({RPE_LABELS[rpe]})</span>
          </label>
          <Slider min={1} max={10} step={1} value={[rpe]} onValueChange={(v) => setRpe(v[0])} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Note (optionnel)</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-12"
            placeholder="Sensations, conditions…"
          />
        </div>
      </div>
      <div className="px-4 pb-8">
        <Button
          className="h-14 w-full text-base font-bold"
          onClick={() => {
            const dist = Number(distance);
            onComplete({
              actual_duration_s: parseMmSs(timeStr),
              actual_distance_m:
                Number.isFinite(dist) && dist > 0 ? Math.round(dist * 1000) : undefined,
              actual_rpe: rpe,
              note: note.trim() || undefined,
            });
          }}
        >
          Valider et continuer →
        </Button>
      </div>
    </div>
  );
}
