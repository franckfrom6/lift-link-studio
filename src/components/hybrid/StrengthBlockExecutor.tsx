import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import LinearRestTimer from "@/components/student/LinearRestTimer";
import {
  HybridBlock,
  InlineExercise,
  RPE_LABELS,
  StrengthSetLog,
  FORMAT_LABELS,
} from "@/types/hybrid";
import { cn } from "@/lib/utils";

interface StrengthBlockExecutorProps {
  block: HybridBlock;
  blockIndex: number;
  totalBlocks: number;
  onComplete: (log: StrengthSetLog[]) => void;
  onSkip: (reason?: string) => void;
}

function mmss(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface SetRow {
  ex_idx: number;
  set_number: number;
  weight: string;
  reps: string;
  done: boolean;
}

export default function StrengthBlockExecutor({
  block,
  blockIndex,
  totalBlocks,
  onComplete,
  onSkip,
}: StrengthBlockExecutorProps) {
  const strength = block.strength;
  const exercises: InlineExercise[] = strength?.exercises ?? [];
  const format = strength?.format ?? "straight";
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  // ─── Timed formats (AMRAP / EMOM / For Time) ───
  const isTimed = format === "amrap" || format === "emom" || format === "for_time";
  const totalCap = strength?.time_cap_s ?? strength?.duration_s ?? 0;
  const [remaining, setRemaining] = useState(totalCap);
  const [timerRunning, setTimerRunning] = useState(false);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!isTimed || !timerRunning) return;
    startRef.current = Date.now();
    const base = remaining;
    const id = setInterval(() => {
      const next = base - Math.floor((Date.now() - startRef.current) / 1000);
      setRemaining(next);
      if (next <= 0) {
        setTimerRunning(false);
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, isTimed]);

  const [timedResult, setTimedResult] = useState("");
  const [timedRpe, setTimedRpe] = useState(7);
  const [timedDone, setTimedDone] = useState(false);

  // ─── Set-based formats ───
  const allRows = useMemo<SetRow[]>(() => {
    const rows: SetRow[] = [];
    exercises.forEach((ex, ex_idx) => {
      for (let i = 1; i <= (ex.sets ?? 1); i++) {
        rows.push({
          ex_idx,
          set_number: i,
          weight: ex.suggested_weight ? String(ex.suggested_weight) : "",
          reps: String(ex.reps_max ?? ex.reps_min ?? ""),
          done: false,
        });
      }
    });
    return rows;
  }, [exercises]);

  const [rows, setRows] = useState<SetRow[]>(allRows);
  const [restFor, setRestFor] = useState<number | null>(null);

  // ─── Renders ───
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

  const TopBar = (
    <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold truncate">{block.name || "Bloc force"}</div>
        <div className="text-xs text-muted-foreground">
          Bloc {blockIndex + 1}/{totalBlocks} • {FORMAT_LABELS[format]}
        </div>
      </div>
      <button
        className="text-xs text-muted-foreground underline shrink-0"
        onClick={() => setShowSkip(true)}
      >
        Passer →
      </button>
    </div>
  );

  if (isTimed) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {TopBar}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <div className="text-center space-y-2">
            <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              {format === "amrap" ? "AMRAP" : format === "emom" ? "EMOM" : "Time cap"}
            </div>
            <div className="text-[64px] font-bold tabular-nums text-primary leading-none">
              {mmss(remaining)}
            </div>
            {!timerRunning && remaining === totalCap && totalCap > 0 && (
              <Button className="h-12 px-6" onClick={() => setTimerRunning(true)}>
                ▶ Démarrer le chrono
              </Button>
            )}
            {timerRunning && (
              <Button variant="outline" className="h-12 px-6" onClick={() => setTimerRunning(false)}>
                Pause
              </Button>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="text-xs uppercase font-semibold text-muted-foreground">
              Exercices prescrits
            </div>
            {exercises.map((ex) => (
              <div key={ex.id} className="flex items-start gap-3">
                <div className="text-xl">💪</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{ex.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {ex.reps_min === ex.reps_max
                      ? `${ex.reps_min} reps`
                      : `${ex.reps_min}–${ex.reps_max} reps`}
                    {ex.suggested_weight ? ` @ ${ex.suggested_weight} kg` : ""}
                    {ex.notes ? ` · ${ex.notes}` : ""}
                  </div>
                </div>
              </div>
            ))}
            {strength?.notes && (
              <p className="text-xs italic text-muted-foreground border-t pt-3">
                {strength.notes}
              </p>
            )}
          </div>

          {(timedDone || remaining <= 0) && (
            <div className="space-y-4 rounded-xl border bg-card p-4">
              <h3 className="font-semibold">Tes résultats</h3>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {format === "amrap" || format === "emom"
                    ? "Rounds / Reps totales"
                    : "Temps réalisé (sec)"}
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={timedResult}
                  onChange={(e) => setTimedResult(e.target.value)}
                  className="h-12 text-lg tabular-nums"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  RPE — <span className="text-primary">{timedRpe}</span>{" "}
                  <span className="text-muted-foreground font-normal">
                    ({RPE_LABELS[timedRpe]})
                  </span>
                </label>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[timedRpe]}
                  onValueChange={(v) => setTimedRpe(v[0])}
                />
              </div>
              <Button
                className="h-14 w-full text-base font-bold"
                onClick={() => {
                  const reps = Number(timedResult);
                  onComplete([
                    {
                      set_number: 1,
                      reps: Number.isFinite(reps) && reps > 0 ? reps : 0,
                      done: true,
                    },
                  ]);
                }}
              >
                Valider et continuer →
              </Button>
            </div>
          )}
        </div>

        {!timedDone && remaining > 0 && (
          <div className="border-t bg-background px-4 py-3">
            <Button
              className="h-14 w-full text-base font-bold"
              onClick={() => {
                setTimerRunning(false);
                setTimedDone(true);
              }}
            >
              Terminé →
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Set-based: straight / superset / rounds
  const allDone = rows.length > 0 && rows.every((r) => r.done);

  const handleValidateSet = (idx: number) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, done: true } : r)));
    const ex = exercises[rows[idx].ex_idx];
    if (ex?.rest_s) setRestFor(ex.rest_s);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {TopBar}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {exercises.map((ex, ex_idx) => {
          const exRows = rows
            .map((r, i) => ({ r, i }))
            .filter(({ r }) => r.ex_idx === ex_idx);
          return (
            <div key={ex.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {ex.group && (
                    <div className="text-[10px] font-bold uppercase text-primary mb-1">
                      {ex.group}
                    </div>
                  )}
                  <div className="font-semibold truncate">{ex.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {ex.sets}×{ex.reps_min === ex.reps_max
                      ? ex.reps_min
                      : `${ex.reps_min}–${ex.reps_max}`}{" "}
                    {ex.rpe_target ? `· RPE ${ex.rpe_target}` : ""}
                    {ex.tempo ? ` · ${ex.tempo}` : ""}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {exRows.map(({ r, i }) => (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-[40px_1fr_1fr_48px] items-center gap-2",
                      r.done && "opacity-60",
                    )}
                  >
                    <div className="text-xs font-semibold text-muted-foreground text-center">
                      S{r.set_number}
                    </div>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="kg"
                      value={r.weight}
                      onChange={(e) =>
                        setRows((p) =>
                          p.map((x, ix) => (ix === i ? { ...x, weight: e.target.value } : x)),
                        )
                      }
                      className="h-11 text-center tabular-nums"
                      disabled={r.done}
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="reps"
                      value={r.reps}
                      onChange={(e) =>
                        setRows((p) =>
                          p.map((x, ix) => (ix === i ? { ...x, reps: e.target.value } : x)),
                        )
                      }
                      className="h-11 text-center tabular-nums"
                      disabled={r.done}
                    />
                    <Button
                      size="icon"
                      variant={r.done ? "secondary" : "default"}
                      className="h-11 w-11"
                      onClick={() => handleValidateSet(i)}
                      disabled={r.done}
                      aria-label="Valider la série"
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {restFor !== null && (
          <div className="rounded-xl border bg-card p-3">
            <LinearRestTimer
              initialSeconds={restFor}
              autoStart
              onComplete={() => setRestFor(null)}
            />
            <button
              onClick={() => setRestFor(null)}
              className="block mx-auto mt-2 text-xs text-muted-foreground underline"
            >
              Passer la récup
            </button>
          </div>
        )}
      </div>

      <div className="border-t bg-background px-4 py-3">
        <Button
          className="h-14 w-full text-base font-bold"
          disabled={!allDone}
          onClick={() => {
            const log: StrengthSetLog[] = rows.map((r) => {
              const weight = Number(r.weight);
              const reps = Number(r.reps);
              return {
                set_number: r.set_number,
                weight: Number.isFinite(weight) && weight > 0 ? weight : undefined,
                reps: Number.isFinite(reps) && reps > 0 ? reps : 0,
                done: r.done,
              };
            });
            onComplete(log);
          }}
        >
          {allDone ? "Bloc terminé →" : `Valide chaque série pour continuer`}
        </Button>
      </div>
    </div>
  );
}
