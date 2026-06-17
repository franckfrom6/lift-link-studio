import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { formatLocalDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import RunBlockEditor from "@/components/student/RunBlockEditor";
import {
  RunBlock,
  RUN_BLOCK_COLORS,
  RUN_BLOCK_LABELS,
  ZONE_LABELS,
  ZONE_COLORS,
  formatPaceSec,
  totalBlocksKm,
  estimatedBlocksMin,
} from "@/types/running";

interface BlockResult {
  block_id: string;
  actual_km?: number;
  actual_min?: number;
  actual_pace_s?: number;
  perceived_effort?: number;
}

type Phase = "ready" | "running" | "done";

const formatHMS = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

const formatMS = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

const blockTargetLabel = (b: RunBlock): string => {
  if (b.type === "interval" && b.repeats) {
    if (b.work_km) return `${b.repeats} × ${Math.round(b.work_km * 1000)} m`;
    if (b.work_min) return `${b.repeats} × ${b.work_min} min`;
  }
  if (b.target_km) return `${b.target_km} km`;
  if (b.target_min) return `${b.target_min} min`;
  return "—";
};

const RunningLiveSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;

  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [blocks, setBlocks] = useState<RunBlock[]>([]);

  const [phase, setPhase] = useState<Phase>("ready");
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [blockResults, setBlockResults] = useState<BlockResult[]>([]);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [blockElapsed, setBlockElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [logKm, setLogKm] = useState<string>("");
  const [logRpe, setLogRpe] = useState<number | undefined>(undefined);

  const [quitOpen, setQuitOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditingBlocks, setIsEditingBlocks] = useState(false);

  // Fetch session
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, name, run_blocks, session_type")
        .eq("id", sessionId)
        .single();
      if (error || !data) {
        toast.error("Séance introuvable");
        navigate("/student");
        return;
      }
      setSessionName(data.name);
      setBlocks(((data.run_blocks as unknown) as RunBlock[]) || []);
      setLoading(false);
    })();
  }, [sessionId, navigate]);

  // Timers
  const tickRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== "running") {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = window.setInterval(() => {
      setSessionElapsed(s => s + 1);
      setBlockElapsed(s => s + 1);
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [phase]);

  const totalKm = useMemo(() => totalBlocksKm(blocks), [blocks]);
  const totalMin = useMemo(() => estimatedBlocksMin(blocks), [blocks]);

  const currentBlock = blocks[activeBlockIdx];

  const handleStart = () => {
    if (!blocks.length) return;
    setStartTime(new Date());
    setPhase("running");
    setActiveBlockIdx(0);
    setBlockElapsed(0);
    setSessionElapsed(0);
    setBlockResults([]);
  };

  const openLogForCurrent = () => {
    if (!currentBlock) return;
    setLogKm(currentBlock.target_km ? String(currentBlock.target_km) : "");
    setLogRpe(undefined);
    setLogSheetOpen(true);
  };

  const advanceAfterLog = (result?: BlockResult) => {
    if (result) setBlockResults(prev => [...prev, result]);
    setLogSheetOpen(false);
    const isLast = activeBlockIdx >= blocks.length - 1;
    if (isLast) {
      setPhase("done");
      return;
    }
    setActiveBlockIdx(i => i + 1);
    setBlockElapsed(0);
  };

  const handleValidateLog = () => {
    if (!currentBlock) return;
    const km = logKm ? parseFloat(logKm) : undefined;
    const min = blockElapsed / 60;
    const actual_pace_s =
      km && km > 0 ? Math.round((min * 60) / km) : undefined;
    advanceAfterLog({
      block_id: currentBlock.id,
      actual_km: km,
      actual_min: Math.round(min * 10) / 10,
      actual_pace_s,
      perceived_effort: logRpe,
    });
  };

  const handlePrevBlock = () => {
    if (activeBlockIdx === 0) return;
    setActiveBlockIdx(i => i - 1);
    setBlockElapsed(0);
    setBlockResults(prev => prev.slice(0, -1));
  };

  const handleSaveFinal = async () => {
    if (!user || !studentId || !sessionId || !startTime) return;
    setSaving(true);
    try {
      const { error: csErr } = await supabase.from("completed_sessions").insert([{
        student_id: studentId,
        session_id: sessionId,
        started_at: startTime.toISOString(),
        completed_at: new Date().toISOString(),
        duration: sessionElapsed,
      }]);
      if (csErr) throw csErr;

      const totalActualKm = blockResults.reduce(
        (a, r) => a + (r.actual_km || 0),
        0,
      );
      const avgPaceSec =
        totalActualKm > 0 && sessionElapsed > 0
          ? Math.round(sessionElapsed / totalActualKm)
          : null;

      await supabase.from("external_sessions").insert([{
        student_id: studentId,
        date: formatLocalDate(new Date()),
        activity_type: "running",
        activity_label: sessionName,
        duration_minutes: Math.round(sessionElapsed / 60),
        distance_meters: Math.round(totalActualKm * 1000),
        avg_pace_s_per_km: avgPaceSec,
        source: "manual",
        metrics: { splits: blockResults } as unknown as never,
      }]);

      toast.success("Séance enregistrée 🎉");
      navigate("/student");
    } catch (e) {
      console.error("[RunningLiveSession] save failed:", e);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!blocks.length) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Cette séance ne contient pas de blocs.
        </p>
        <Button onClick={() => navigate("/student")}>Retour</Button>
      </div>
    );
  }

  /* ---------------- PHASE: READY ---------------- */
  if (phase === "ready") {
    return (
      <div className="p-4 space-y-4 max-w-xl mx-auto pb-32">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button
            type="button"
            onClick={() => setIsEditingBlocks(true)}
            className="w-11 h-11 inline-flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Modifier la séance"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Course à pied
          </p>
          <h1 className="text-xl font-bold">{sessionName}</h1>
          <p className="text-sm text-muted-foreground tabular-nums mt-1">
            {totalKm.toFixed(1)} km · ~{Math.round(totalMin)} min · {blocks.length} blocs
          </p>
        </div>

        <div className="space-y-2">
          {blocks.map((b, i) => (
            <div
              key={b.id}
              className={cn(
                "rounded-lg border p-3 flex items-center justify-between gap-3",
                RUN_BLOCK_COLORS[b.type],
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {i + 1}. {RUN_BLOCK_LABELS[b.type]}
                </p>
                <p className="text-xs opacity-80 tabular-nums">
                  {blockTargetLabel(b)}
                  {b.pace_max_s && b.pace_min_s
                    ? ` · ${formatPaceSec(b.pace_max_s)} – ${formatPaceSec(b.pace_min_s)}`
                    : ""}
                </p>
              </div>
              {b.zone && (
                <span className={cn("text-xs font-bold", ZONE_COLORS[b.zone])}>
                  Z{b.zone}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="fixed left-0 right-0 bottom-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <Button onClick={handleStart} className="w-full h-14 text-base">
            Démarrer la séance
          </Button>
        </div>

        <RunBlockEditor
          open={isEditingBlocks}
          onClose={() => setIsEditingBlocks(false)}
          date={new Date()}
          sessionName={sessionName}
          initialBlocks={blocks}
          onSave={async (newName, newBlocks) => {
            if (!sessionId) return;
            const { error } = await supabase
              .from("sessions")
              .update({
                name: newName,
                run_blocks: newBlocks as unknown as never,
              })
              .eq("id", sessionId);
            if (error) {
              console.error("[RunningLiveSession] update failed:", error);
              toast.error("Erreur lors de la mise à jour");
              return;
            }
            setSessionName(newName);
            setBlocks(newBlocks);
            toast.success("Séance mise à jour");
          }}
        />
      </div>
    );
  }

  /* ---------------- PHASE: DONE ---------------- */
  if (phase === "done") {
    const totalActualKm = blockResults.reduce(
      (a, r) => a + (r.actual_km || 0),
      0,
    );
    const avgPaceSec =
      totalActualKm > 0 && sessionElapsed > 0
        ? Math.round(sessionElapsed / totalActualKm)
        : null;

    return (
      <div className="p-4 space-y-4 max-w-xl mx-auto pb-32">
        <h1 className="text-xl font-bold">Séance terminée 🎉</h1>
        <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-lg font-bold tabular-nums">{totalActualKm.toFixed(2)} km</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Durée</p>
            <p className="text-lg font-bold tabular-nums">{formatHMS(sessionElapsed)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Allure moy.</p>
            <p className="text-lg font-bold tabular-nums">{formatPaceSec(avgPaceSec || undefined)}</p>
          </div>
        </div>

        <div className="space-y-2">
          {blocks.map((b, i) => {
            const r = blockResults[i];
            const blockKm = r?.actual_km ?? 0;
            const pct = totalActualKm > 0 ? (blockKm / totalActualKm) * 100 : 0;
            return (
              <div
                key={b.id}
                className={cn(
                  "rounded-lg border p-3 space-y-2",
                  RUN_BLOCK_COLORS[b.type],
                )}
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold truncate">
                    {i + 1}. {RUN_BLOCK_LABELS[b.type]}
                  </span>
                  <span className="tabular-nums opacity-80">
                    {blockKm > 0 ? `${blockKm.toFixed(2)} km` : "—"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-background/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-xs opacity-80 tabular-nums">
                  <span>Obj. {blockTargetLabel(b)}</span>
                  <span className="flex items-center gap-2">
                    {r?.actual_min ? <span>{r.actual_min.toFixed(1)} min</span> : null}
                    {r?.actual_pace_s ? (
                      <span>{formatPaceSec(r.actual_pace_s)} /km</span>
                    ) : null}
                    {r?.perceived_effort ? <span>RPE {r.perceived_effort}</span> : null}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="fixed left-0 right-0 bottom-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <Button
            onClick={handleSaveFinal}
            disabled={saving}
            className="w-full h-14 text-base"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- PHASE: RUNNING ---------------- */
  const isLast = activeBlockIdx >= blocks.length - 1;
  const cb = currentBlock!;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-background">
        <button
          onClick={() => setQuitOpen(true)}
          className="w-11 h-11 inline-flex items-center justify-center rounded-md hover:bg-accent"
          aria-label="Quitter"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-xs text-muted-foreground truncate">{sessionName}</p>
          <p className="text-sm font-bold tabular-nums">{formatHMS(sessionElapsed)}</p>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums w-16 text-right">
          Bloc {activeBlockIdx + 1} / {blocks.length}
        </p>
      </div>

      {/* Center card */}
      <div className="flex-1 p-4 flex flex-col">
        <div
          className={cn(
            "flex-1 rounded-2xl border p-6 flex flex-col items-center justify-center gap-3 text-center",
            RUN_BLOCK_COLORS[cb.type],
          )}
        >
          <p className="text-3xl font-bold">{RUN_BLOCK_LABELS[cb.type]}</p>
          <p className="text-4xl tabular-nums font-bold">
            {blockTargetLabel(cb)}
          </p>
          {cb.pace_max_s && cb.pace_min_s && (
            <p className="text-sm opacity-80 tabular-nums">
              Allure {formatPaceSec(cb.pace_max_s)} – {formatPaceSec(cb.pace_min_s)}
            </p>
          )}
          {cb.zone && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-background/60 text-xs font-semibold">
              Z{cb.zone} · {ZONE_LABELS[cb.zone].split("· ")[1]}
            </span>
          )}
          <p className="text-2xl tabular-nums font-bold mt-2">
            {formatMS(blockElapsed)}
          </p>
          {cb.notes && (
            <p className="italic text-sm opacity-80">{cb.notes}</p>
          )}
        </div>

        {/* Bottom controls */}
        <div className="mt-4 space-y-2">
          <Button onClick={openLogForCurrent} className="w-full h-14 text-base">
            {isLast ? "Terminer la séance" : "Bloc suivant →"}
          </Button>
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevBlock}
              disabled={activeBlockIdx === 0}
              className="text-xs text-muted-foreground min-h-[44px] px-2 disabled:opacity-30"
            >
              ← Bloc précédent
            </button>
            <div className="flex items-center gap-1">
              {blocks.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    i <= activeBlockIdx ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </div>
            <span className="w-[88px]" />
          </div>
        </div>
      </div>

      {/* Quick log sheet */}
      <Sheet open={logSheetOpen} onOpenChange={v => !v && setLogSheetOpen(false)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-base">Comment s'est passé ce bloc ?</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="log-km">Distance parcourue (km)</Label>
              <Input
                id="log-km"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                value={logKm}
                onChange={e => setLogKm(e.target.value)}
                className="h-12 tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label>Effort perçu (RPE)</Label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setLogRpe(n)}
                    className={cn(
                      "min-w-[44px] min-h-[44px] rounded-md border text-sm font-semibold tabular-nums transition shrink-0",
                      logRpe === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:bg-accent",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleValidateLog} className="flex-1 h-12">
                {isLast ? "Terminer la séance" : "Valider"}
              </Button>
              <button
                onClick={() => advanceAfterLog()}
                className="text-sm text-muted-foreground min-h-[44px] px-2"
              >
                Passer
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quit confirm */}
      <AlertDialog open={quitOpen} onOpenChange={setQuitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter la séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tes progrès actuels ne seront pas enregistrés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/student")}>
              Quitter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RunningLiveSession;