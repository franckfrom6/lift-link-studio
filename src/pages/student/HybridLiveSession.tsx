import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import {
  BLOCK_TYPE_COLORS,
  BLOCK_TYPE_ICONS,
  BLOCK_TYPE_LABELS,
  BlockExecution,
  CardioBlockLog,
  HybridBlock,
  MODALITY_LABELS,
  MixedSubLog,
  StrengthSetLog,
  blockSummary,
  estimatedSessionDuration,
  formatDuration,
} from "@/types/hybrid";
import CardioBlockExecutor from "@/components/hybrid/CardioBlockExecutor";
import MixedBlockExecutor from "@/components/hybrid/MixedBlockExecutor";
import StrengthBlockExecutor from "@/components/hybrid/StrengthBlockExecutor";
import HybridSessionRecap from "@/components/hybrid/HybridSessionRecap";
import { HybridSessionBuilder } from "@/components/hybrid/HybridSessionBuilder";
import { cn } from "@/lib/utils";

type Phase = "overview" | "executing" | "done";

interface SessionRow {
  id: string;
  name: string | null;
  session_type: string | null;
  hybrid_blocks: any;
  free_session_date?: string | null;
}

function mmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function HybridLiveSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const studentId = user ? effectiveStudentId(user.id) : null;
  const [session, setSession] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("overview");
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [blockExecutions, setBlockExecutions] = useState<BlockExecution[]>([]);

  const sessionStartRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [isEditingSession, setIsEditingSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionId) return;
      const { data, error } = await supabase
        .from("sessions")
        .select("id, name, hybrid_blocks, session_type, free_session_date")
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
  const handleStrengthComplete = (log: StrengthSetLog[]) =>
    advance({ block_id: blocks[activeBlockIdx].id, status: "done", strength_log: log });
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

    const dateStr = session.free_session_date
      ? new Date(session.free_session_date).toLocaleDateString("fr-FR", {
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
            <h1 className="flex-1 text-lg font-bold truncate">
              {session.name || "Séance hybride"}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditingSession(true)}
              aria-label="Modifier la séance"
            >
              <Pencil className="h-5 w-5" />
            </Button>
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

        <HybridSessionBuilder
          open={isEditingSession}
          onClose={() => setIsEditingSession(false)}
          date={session.free_session_date ? new Date(session.free_session_date) : new Date()}
          initialName={session.name ?? ""}
          initialBlocks={blocks}
          onSave={async (newName, newBlocks) => {
            if (!sessionId) return;
            const { error } = await supabase
              .from("sessions")
              .update({
                name: newName,
                hybrid_blocks: newBlocks as unknown as never,
              })
              .eq("id", sessionId);
            if (error) {
              console.error("[HybridLiveSession] update failed:", error);
              toast.error("Erreur lors de la mise à jour");
              return;
            }
            setSession((prev) =>
              prev ? { ...prev, name: newName, hybrid_blocks: newBlocks } : prev,
            );
            toast.success("Séance mise à jour");
          }}
        />
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

    // strength
    return (
      <StrengthBlockExecutor
        key={block.id}
        block={block}
        blockIndex={activeBlockIdx}
        totalBlocks={blocks.length}
        onComplete={handleStrengthComplete}
        onSkip={handleSkip}
      />
    );
  }

  // phase === "done"
  return (
    <HybridSessionRecap
      session={{
        id: session.id,
        name: session.name || "Séance hybride",
        hybrid_blocks: blocks,
      }}
      blockExecutions={blockExecutions}
      elapsedSeconds={elapsed}
      onSave={async (globalRpe, sensation, notes) => {
        try {
          if (!user || !studentId) throw new Error("not auth");
          const { data: cs, error: csErr } = await supabase
            .from("completed_sessions")
            .insert({
              student_id: studentId,
              session_id: sessionId!,
              started_at: new Date(sessionStartRef.current).toISOString(),
              completed_at: new Date().toISOString(),
              duration: elapsed,
              global_rpe: globalRpe,
              sensation_tag: sensation,
              notes_for_coach: notes || null,
            })
            .select("id")
            .single();
          if (csErr) throw csErr;

          if (blockExecutions.length > 0) {
            await supabase.from("hybrid_block_executions").insert(
              blockExecutions.map((be) => ({
                completed_session_id: cs.id,
                block_id: be.block_id,
                status: be.status,
                skip_reason: be.skip_reason || null,
                log_data: {
                  cardio_log: be.cardio_log,
                  strength_log: be.strength_log,
                  mixed_log: be.mixed_log,
                } as any,
              })),
            );
          }

          toast.success("Séance enregistrée !");
          navigate("/student");
        } catch {
          toast.error("Erreur lors de l'enregistrement");
        }
      }}
    />
  );
}
