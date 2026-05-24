import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BLOCK_TYPE_COLORS,
  BLOCK_TYPE_ICONS,
  BLOCK_TYPE_LABELS,
  BlockExecution,
  CardioBlockLog,
  HybridBlock,
  MODALITY_LABELS,
  MixedSubLog,
  blockSummary,
  estimatedSessionDuration,
  formatDuration,
} from "@/types/hybrid";
import CardioBlockExecutor from "@/components/hybrid/CardioBlockExecutor";
import MixedBlockExecutor from "@/components/hybrid/MixedBlockExecutor";
import { cn } from "@/lib/utils";

type Phase = "overview" | "executing" | "done";

interface SessionRow {
  id: string;
  name: string | null;
  session_type: string | null;
  hybrid_blocks: any;
  scheduled_date?: string | null;
}

function mmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function HybridLiveSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("overview");
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [blockExecutions, setBlockExecutions] = useState<BlockExecution[]>([]);

  const sessionStartRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionId) return;
      const { data, error } = await supabase
        .from("sessions")
        .select("id, name, hybrid_blocks, session_type, scheduled_date")
        .eq("id", sessionId)
        .single();
      if (!cancelled) {
        if (error) {
          toast.error("Séance introuvable");
          navigate(-1);
          return;
        }
        setSession(data as SessionRow);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, navigate]);

  const blocks = useMemo<HybridBlock[]>(
    () => (Array.isArray(session?.hybrid_blocks) ? (session?.hybrid_blocks as HybridBlock[]) : []),
    [session],
  );

  useEffect(() => {
    if (phase !== "executing") return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [phase]);

  const advance = (exec: BlockExecution) => {
    setBlockExecutions((prev) => [...prev, exec]);
    if (activeBlockIdx >= blocks.length - 1) {
      setPhase("done");
    } else {
      setActiveBlockIdx((i) => i + 1);
    }
  };

  const handleCardioComplete = (log: CardioBlockLog) =>
    advance({ block_id: blocks[activeBlockIdx].id, status: "done", cardio_log: log });
  const handleMixedComplete = (log: MixedSubLog[]) => {
    const allDone = log.every((l) => l.done);
    advance({
      block_id: blocks[activeBlockIdx].id,
      status: allDone ? "done" : "partial",
      mixed_log: log,
    });
  };
  const handleSkip = (reason?: string) =>
    advance({ block_id: blocks[activeBlockIdx].id, status: "skipped", skip_reason: reason });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!session) return null;

  if (phase === "overview") {
    const estimated = estimatedSessionDuration(blocks);
    const modalities = Array.from(
      new Set(blocks.flatMap((b) => (b.cardio ? [MODALITY_LABELS[b.cardio.modality]] : []))),
    );
    const exerciseNames = Array.from(
      new Set(
        blocks.flatMap((b) => [
          ...(b.strength?.exercises?.map((e) => e.name) ?? []),
          ...(b.sub_blocks?.map((s) => s.exercise?.name).filter(Boolean) ?? []),
        ]),
      ),
    ) as string[];
    const equipment = [...modalities, ...exerciseNames];
    const equipmentDisplay = equipment.slice(0, 5);
    const equipmentExtra = equipment.length - equipmentDisplay.length;

    const dateStr = session.scheduled_date
      ? new Date(session.scheduled_date).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "";

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold truncate">
              {session.name || "Séance hybride"}
            </h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-32">
          <div className="space-y-1">
            {dateStr && <div className="text-sm text-muted-foreground capitalize">{dateStr}</div>}
            <div className="text-sm text-muted-foreground">
              Durée estimée : <span className="font-semibold">{formatDuration(estimated)}</span>
            </div>
          </div>

          {equipment.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Matériel & exercices
              </div>
              <div className="flex flex-wrap gap-2">
                {equipmentDisplay.map((e) => (
                  <Badge key={e} variant="secondary" className="text-xs">
                    {e}
                  </Badge>
                ))}
                {equipmentExtra > 0 && (
                  <Badge variant="outline" className="text-xs">
                    + {equipmentExtra} autres
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              {blocks.length} blocs
            </div>
            <div className="space-y-2">
              {blocks.map((b, i) => (
                <div
                  key={b.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl border",
                    BLOCK_TYPE_COLORS[b.type],
                  )}
                >
                  <div className="text-xl shrink-0">{BLOCK_TYPE_ICONS[b.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase font-semibold opacity-80">
                      {i + 1}. {BLOCK_TYPE_LABELS[b.type]}
                    </div>
                    <div className="text-sm font-medium truncate">
                      {b.name || blockSummary(b)}
                    </div>
                    <div className="text-xs opacity-80 truncate">{blockSummary(b)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-background border-t p-4">
          <div className="max-w-2xl mx-auto">
            <Button
              className="h-16 w-full text-base font-bold"
              disabled={blocks.length === 0}
              onClick={() => {
                sessionStartRef.current = Date.now();
                setElapsed(0);
                setActiveBlockIdx(0);
                setBlockExecutions([]);
                setPhase("executing");
              }}
            >
              Démarrer la séance ▶
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "executing") {
    const block = blocks[activeBlockIdx];
    if (!block) return null;

    if (block.type === "cardio" || block.type === "warmup" || block.type === "cooldown") {
      return (
        <CardioBlockExecutor
          key={block.id}
          block={block}
          blockIndex={activeBlockIdx}
          totalBlocks={blocks.length}
          onComplete={handleCardioComplete}
          onSkip={handleSkip}
        />
      );
    }

    if (block.type === "mixed") {
      return (
        <MixedBlockExecutor
          key={block.id}
          block={block}
          blockIndex={activeBlockIdx}
          totalBlocks={blocks.length}
          onComplete={handleMixedComplete}
          onSkip={handleSkip}
        />
      );
    }

    // Strength placeholder (next step)
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="px-4 pt-6 text-center text-sm text-muted-foreground">
          Bloc {activeBlockIdx + 1} / {blocks.length} • {mmss(elapsed)}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-7xl">💪</div>
          <h1 className="text-2xl font-bold">{block.name || "Bloc Force"}</h1>
          <p className="text-sm text-muted-foreground">{blockSummary(block)}</p>
          <p className="text-xs text-muted-foreground italic max-w-sm">
            Saisie inline des séries arrive bientôt — termine le bloc à ton rythme et valide.
          </p>
        </div>
        <div className="px-4 pb-8 space-y-3">
          <Button
            className="h-14 w-full text-base font-bold"
            onClick={() =>
              advance({ block_id: block.id, status: "done" })
            }
          >
            Bloc terminé →
          </Button>
          <button
            className="block mx-auto text-sm text-muted-foreground underline"
            onClick={() => handleSkip()}
          >
            Passer ce bloc →
          </button>
        </div>
      </div>
    );
  }

  // phase === "done"
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-6xl">🏁</div>
      <h1 className="text-2xl font-bold">Séance terminée !</h1>
      <p className="text-sm text-muted-foreground">
        {blockExecutions.filter((b) => b.status === "done").length} / {blocks.length} blocs complétés
        • {mmss(elapsed)}
      </p>
      <p className="text-xs italic text-muted-foreground max-w-sm">
        Le récap détaillé (RPE global, sensation, sauvegarde) arrive à l'étape suivante.
      </p>
      <Button className="mt-4 h-12 px-8" onClick={() => navigate("/student")}>
        Retour à ma semaine
      </Button>
    </div>
  );
}
