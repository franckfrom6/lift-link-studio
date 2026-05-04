import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, MoreHorizontal, Timer, ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudentProgram } from "@/hooks/useStudentProgram";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Meta, SectionLabel, VideoThumb, StatBadge, ExerciseNumber } from "@/components/student/SageAtoms";
import { ExerciseVideoEmbed } from "@/components/student/ExerciseVideoEmbed";

/**
 * SessionPreview — Sage variant
 * Sober list, classic hierarchy:
 *   Header sticky → meta strip (3 cols) → coach note → warmup card →
 *   blocks (exercise cards) → sticky CTA "Démarrer la séance"
 *
 * Sits between StudentWeek and LiveSession. The athlete previews the
 * session BEFORE starting; CTA navigates to /student/session/:id (LiveSession).
 */

// ────────── helpers ──────────
const isWarmupSection = (sec: any): boolean => {
  const n = (sec?.name || "").toLowerCase();
  return /échauffement|echauffement|warm[\s-]?up|🔥/.test(n);
};

const repsLabel = (e: any): string => {
  const min = e.reps_min ?? 0;
  const max = e.reps_max ?? min;
  if (!min && !max) return "—";
  return min === max ? String(min) : `${min}-${max}`;
};

const isTimeTracking = (e: any): boolean => {
  const t = e?.exercise?.tracking_type;
  return t === "duration" || t === "duration_only" || t === "time";
};

const sumDuration = (sections: any[]): number => {
  // Rough estimate: sum of (sets × (avg_reps × 3s + rest_seconds)) / 60
  let totalSec = 0;
  for (const sec of sections) {
    for (const ex of sec.exercises ?? []) {
      const sets = ex.sets ?? 0;
      const avgReps = ((ex.reps_min ?? 0) + (ex.reps_max ?? 0)) / 2 || 10;
      const rest = ex.rest_seconds ?? 60;
      const work = isTimeTracking(ex) ? avgReps : avgReps * 3;
      totalSec += sets * (work + rest);
    }
  }
  return Math.max(1, Math.round(totalSec / 60));
};

const sumVolume = (sections: any[]): number => {
  let kg = 0;
  for (const sec of sections) {
    for (const ex of sec.exercises ?? []) {
      const sets = ex.sets ?? 0;
      const avgReps = ((ex.reps_min ?? 0) + (ex.reps_max ?? 0)) / 2;
      const w = Number(ex.suggested_weight) || 0;
      kg += sets * avgReps * w;
    }
  }
  return kg;
};

// ────────── building blocks ──────────
const ExerciseCard = ({ ex, idx, onPreviewVideo }: { ex: any; idx: number; onPreviewVideo: (ex: any) => void }) => {
  const exData = ex.exercise || {};
  const hasVideo = !!(ex.video_url || exData.video_url_male || exData.video_url_female);
  const time = isTimeTracking(ex);
  const sets = ex.sets ?? 0;
  const w = Number(ex.suggested_weight) || 0;

  return (
    <div className="bg-card border border-border rounded-md p-3.5 flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5">
        <ExerciseNumber idx={idx} />
        <VideoThumb hasVideo={hasVideo} onClick={() => onPreviewVideo(ex)} />
        <div className="flex-1 min-w-0">
          {exData.id ? (
            <Link
              to={`/student/exercise/${exData.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block text-[15px] font-bold text-foreground tracking-tight leading-snug hover:text-primary transition-colors"
            >
              {exData.name || "Exercice"}
            </Link>
          ) : (
            <div className="text-[15px] font-bold text-foreground tracking-tight leading-snug">
              {exData.name || "Exercice"}
            </div>
          )}
          {ex.coach_notes && (
            <div className="text-xs text-muted-foreground mt-1 leading-snug">{ex.coach_notes}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <StatBadge>{sets} séries</StatBadge>
        <StatBadge>
          {repsLabel(ex)} {time ? "sec" : "reps"}
        </StatBadge>
        {w > 0 && <StatBadge accent>{w} kg</StatBadge>}
        {ex.tempo && <StatBadge>tempo {ex.tempo}</StatBadge>}
        {ex.rpe_target && <StatBadge>RPE {ex.rpe_target}</StatBadge>}
        {ex.rest_seconds && (
          <StatBadge>
            <Timer className="w-2.5 h-2.5" />
            {ex.rest_seconds}s
          </StatBadge>
        )}
      </div>
    </div>
  );
};

const WarmupCard = ({ section }: { section: any }) => (
  <div className="mb-5">
    <SectionLabel label="Échauffement" right={section.duration_estimate || undefined} />
    <div className="px-4">
      <div className="bg-card border border-border rounded-md">
        {section.exercises.map((ex: any, i: number) => (
          <div
            key={ex.id}
            className={cn(
              "px-3.5 py-3 flex items-start gap-2.5",
              i < section.exercises.length - 1 && "border-b border-border"
            )}
          >
            <div className="text-[11px] font-bold text-muted-subtle w-3.5 flex-shrink-0 mt-0.5 tabular-nums">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              {ex.exercise?.id ? (
                <Link
                  to={`/student/exercise/${ex.exercise.id}`}
                  className="block text-sm font-semibold text-foreground tracking-tight hover:text-primary transition-colors"
                >
                  {ex.exercise?.name || "Mouvement"}
                </Link>
              ) : (
                <div className="text-sm font-semibold text-foreground tracking-tight">
                  {ex.exercise?.name || "Mouvement"}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-0.5">
                {ex.sets} × {repsLabel(ex)} {isTimeTracking(ex) ? "sec" : "reps"}
                {ex.coach_notes ? ` · ${ex.coach_notes}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const BlockSection = ({ section, startIdx, onPreviewVideo }: { section: any; startIdx: number; onPreviewVideo: (ex: any) => void }) => (
  <div className="mb-5">
    <SectionLabel label={section.name} right={`${section.exercises.length} exos`} />
    <div className="px-4 flex flex-col gap-2">
      {section.exercises.map((ex: any, i: number) => (
        <ExerciseCard key={ex.id} ex={ex} idx={startIdx + i + 1} onPreviewVideo={onPreviewVideo} />
      ))}
    </div>
  </div>
);

// ────────── page ──────────
const SessionPreview = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { program, loading: programLoading } = useStudentProgram();
  const [freeSession, setFreeSession] = useState<any>(null);
  const [freeLoading, setFreeLoading] = useState(false);
  const [videoEx, setVideoEx] = useState<any | null>(null);

  // Resolve session: program-bound first, then fallback to free/standalone
  const programSession = useMemo(() => {
    const sessions = program?.weeks?.flatMap((w) => w.sessions) || [];
    return sessions.find((s) => s.id === sessionId) || null;
  }, [program?.weeks, sessionId]);

  useEffect(() => {
    if (programLoading || programSession || !sessionId) return;
    setFreeLoading(true);
    (async () => {
      const { data } = await supabase
        .from("sessions")
        .select(`
          id, name, day_of_week, notes, is_free_session, created_by,
          session_sections(id, name, sort_order, notes, duration_estimate, icon),
          session_exercises(
            id, sort_order, sets, reps_min, reps_max, rest_seconds, tempo,
            rpe_target, suggested_weight, coach_notes, video_url, video_search_query,
            section_id,
            exercise:exercises(id, name, name_en, muscle_group, equipment, type, tracking_type, video_url_female, video_url_male)
          )
        `)
        .eq("id", sessionId)
        .maybeSingle();
      if (data) {
        const sections = (data.session_sections || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((sec: any) => ({
            ...sec,
            exercises: (data.session_exercises || [])
              .filter((e: any) => e.section_id === sec.id)
              .sort((a: any, b: any) => a.sort_order - b.sort_order),
          }));
        const unsectioned = (data.session_exercises || [])
          .filter((e: any) => !e.section_id)
          .sort((a: any, b: any) => a.sort_order - b.sort_order);
        if (unsectioned.length > 0) {
          sections.push({
            id: "default",
            name: "Exercices",
            sort_order: 999,
            notes: null,
            duration_estimate: null,
            icon: null,
            exercises: unsectioned,
          });
        }
        setFreeSession({ ...data, sections });
      }
      setFreeLoading(false);
    })();
  }, [programLoading, programSession, sessionId]);

  const session = programSession || freeSession;
  const loading = programLoading || freeLoading;

  const { warmupSection, blockSections, totalExercises, durationMin, volumeT, weekInfo } = useMemo(() => {
    if (!session) {
      return { warmupSection: null as any, blockSections: [] as any[], totalExercises: 0, durationMin: 0, volumeT: 0, weekInfo: null as any };
    }
    const allSections = session.sections || [];
    const warmup = allSections.find(isWarmupSection) || null;
    const blocks = allSections.filter((s: any) => !isWarmupSection(s));
    const total = blocks.reduce((sum: number, s: any) => sum + (s.exercises?.length || 0), 0);
    const dur = sumDuration(allSections);
    const vol = sumVolume(allSections) / 1000;

    // Find current week info from program
    let wInfo: { current: number; total: number } | null = null;
    if (program?.weeks?.length) {
      const idx = program.weeks.findIndex((w) => w.sessions.some((s) => s.id === session.id));
      if (idx >= 0) wInfo = { current: program.weeks[idx].week_number, total: program.weeks.length };
    }
    return {
      warmupSection: warmup,
      blockSections: blocks,
      totalExercises: total,
      durationMin: dur,
      volumeT: vol,
      weekInfo: wInfo,
    };
  }, [session, program?.weeks]);

  const handleStart = () => {
    if (!sessionId) return;
    navigate(`/student/session/${sessionId}`);
  };

  // ─── loading ───
  if (loading || (!session && (programLoading || freeLoading))) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── not found ───
  if (!session) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-6 bg-background">
        <p className="text-sm text-muted-foreground text-center">Séance introuvable.</p>
        <Button variant="outline" onClick={() => navigate("/student")}>Retour</Button>
      </div>
    );
  }

  // Compute starting index across blocks for global numbering
  let runningIdx = 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      {/* Header sticky */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-sm border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Retour"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0 text-center">
            {weekInfo && (
              <div className="text-[9px] uppercase tracking-[0.12em] font-semibold text-muted-subtle mb-0.5">
                Semaine {weekInfo.current}/{weekInfo.total}
              </div>
            )}
            <div className="text-sm font-bold text-foreground tracking-tight truncate">
              {session.name}
            </div>
          </div>
          <button
            className="w-11 h-11 rounded-sm border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Plus d'options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scroll body */}
      <div className="flex-1 overflow-auto">
        {/* Meta strip */}
        <div className="grid grid-cols-3 p-4 border-b border-border">
          <Meta value={durationMin} unit="min" label="Durée est." />
          <Meta value={totalExercises} label="Exercices" border />
          <Meta value={volumeT > 0 ? volumeT.toFixed(1) : "—"} unit={volumeT > 0 ? "T" : undefined} label="Volume est." />
        </div>

        {/* Coach note */}
        {session.notes && (
          <div className="m-4 p-3 bg-bg-tinted rounded-md border border-border border-l-[3px] border-l-foreground flex gap-2.5">
            <div className="text-[9px] uppercase tracking-[0.12em] font-semibold text-muted-subtle flex-shrink-0 mt-0.5">
              COACH
            </div>
            <div className="text-[13px] text-muted-foreground leading-relaxed font-medium">
              {session.notes}
            </div>
          </div>
        )}

        {/* Warmup */}
        {warmupSection && warmupSection.exercises?.length > 0 && (
          <WarmupCard section={warmupSection} />
        )}

        {/* Blocks */}
        {blockSections.map((section: any) => {
          const block = <BlockSection key={section.id} section={section} startIdx={runningIdx} onPreviewVideo={setVideoEx} />;
          runningIdx += section.exercises?.length || 0;
          return block;
        })}

        <div className="h-4" />
      </div>

      {/* Sticky CTA */}
      <div
        className="sticky bottom-0 z-20 border-t border-border bg-background px-4 pt-2.5"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          onClick={handleStart}
          className="w-full h-13 min-h-[52px] rounded-md bg-primary text-primary-foreground font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          aria-label="Démarrer la séance"
        >
          Démarrer la séance
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Video preview modal */}
      {videoEx && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setVideoEx(null)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-md p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-foreground tracking-tight truncate pr-2">
                {videoEx.exercise?.name || "Exercice"}
              </div>
              <button
                type="button"
                onClick={() => setVideoEx(null)}
                className="w-9 h-9 rounded-sm border border-border bg-bg-tinted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ExerciseVideoEmbed
              exerciseName={videoEx.exercise?.name || "exercise"}
              directVideoUrl={videoEx.video_url}
              videoUrlFemale={videoEx.exercise?.video_url_female}
              videoUrlMale={videoEx.exercise?.video_url_male}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionPreview;