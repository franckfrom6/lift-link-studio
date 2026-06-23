import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Bookmark, Trophy, TrendingUp, Dumbbell, AlertCircle } from "lucide-react";
import { useExerciseDetail, useToggleFavorite, useRequestVideo } from "@/hooks/useExerciseDetail";
import { useAuth } from "@/contexts/AuthContext";
import { ExerciseProgressionChart } from "@/components/exercise/ExerciseProgressionChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExerciseVideoEmbed } from "@/components/student/ExerciseVideoEmbed";
import FeatureGate from "@/components/plans/FeatureGate";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).replace(".", "");
}

function fmtRelDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "il y a 1 jour";
  return `il y a ${days} jours`;
}

interface ExerciseDetailPageProps {
  /** When set (coach view), overrides the connected user as the data target. */
  studentIdOverride?: string;
}

export default function ExerciseDetailPage({ studentIdOverride }: ExerciseDetailPageProps = {}) {
  const { exerciseId, studentId: routeStudentId } = useParams<{ exerciseId: string; studentId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isCoachView = !!studentIdOverride || !!routeStudentId || location.pathname.startsWith("/coach");
  const targetStudentId = studentIdOverride ?? routeStudentId ?? user?.id;
  const viewerIsAthlete = !isCoachView;

  const { data, isLoading, error } = useExerciseDetail(exerciseId, targetStudentId, viewerIsAthlete);
  const toggleFav = useToggleFavorite(exerciseId ?? "", targetStudentId ?? "");
  const reqVideo = useRequestVideo(exerciseId ?? "", targetStudentId ?? "", data?.coachId ?? null);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 flex-1 max-w-[200px]" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="aspect-video w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-6 text-center gap-3">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Impossible de charger cet exercice.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  const { exercise, sessions, pr, e1rmCurrent, e1rmDelta90d, isFavorite } = data;

  return (
    <div className="min-h-dvh bg-background pb-safe-nav">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Retour"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <div className="text-[9px] uppercase tracking-[0.06em] text-muted-subtle font-semibold">{exercise.muscle_group}</div>
            <div className="text-sm font-bold tracking-tight truncate">{exercise.name}</div>
          </div>
          {viewerIsAthlete ? (
            <button
              onClick={() => toggleFav.mutate(!isFavorite)}
              disabled={toggleFav.isPending}
              className={cn(
                "w-8 h-8 rounded-md border flex items-center justify-center transition-colors",
                isFavorite
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Bookmark className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
            </button>
          ) : (
            <div className="w-8 h-8" aria-hidden />
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* ── Hero video (with YouTube search fallback like in LiveSession) ── */}
        <section>
          <ExerciseVideoEmbed
            exerciseName={exercise.name}
            videoUrlMale={exercise.video_url_male}
            videoUrlFemale={exercise.video_url_female}
          />
          {viewerIsAthlete && data.coachId && !exercise.video_url_male && !exercise.video_url_female && (
            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={reqVideo.isPending || reqVideo.isSuccess}
                onClick={() => {
                  reqVideo.mutate(undefined, {
                    onSuccess: () => toast.success("Demande envoyée à ton coach"),
                    onError: () => toast.error("Erreur — réessaie plus tard"),
                  });
                }}
              >
                {reqVideo.isSuccess ? "Demande envoyée ✓" : "Demander une vidéo au coach"}
              </Button>
            </div>
          )}
        </section>

        {/* ── Meta strip ── */}
        <section className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-sm bg-secondary text-secondary-foreground border border-border font-medium">
            <Dumbbell className="w-3 h-3 inline mr-1 -mt-0.5" />
            {exercise.equipment}
          </span>
          {exercise.secondary_muscle && (
            <span className="px-2 py-1 rounded-sm bg-secondary text-secondary-foreground border border-border font-medium">
              {exercise.secondary_muscle}
            </span>
          )}
          <span className="px-2 py-1 rounded-sm bg-secondary text-muted-foreground border border-border capitalize">
            {exercise.type}
          </span>
        </section>

        {/* ── PR card ── */}
        {pr && (
          <section className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-semibold">
                  <Trophy className="w-3 h-3" />
                  Record personnel
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight tabular-nums text-primary">{pr.weight}</span>
                  <span className="text-sm text-muted-foreground">kg × {pr.reps}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-subtle">{fmtRelDays(pr.date)}</div>
              </div>
              {e1rmCurrent !== null && (
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-semibold">1RM estimé</div>
                  <div className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">{Math.round(e1rmCurrent)}<span className="text-sm text-muted-foreground font-normal"> kg</span></div>
                  {e1rmDelta90d !== null && Math.abs(e1rmDelta90d) >= 0.5 && (
                    <div className={cn("mt-1 text-[11px] font-medium tabular-nums flex items-center justify-end gap-0.5", e1rmDelta90d > 0 ? "text-success" : "text-muted-foreground")}>
                      <TrendingUp className={cn("w-3 h-3", e1rmDelta90d < 0 && "rotate-180")} />
                      {e1rmDelta90d > 0 ? "+" : ""}{e1rmDelta90d.toFixed(1)} kg / 90j
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Progression chart ── */}
        <FeatureGate feature="strength_charts" showLocked>
          <section className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-semibold">
                Progression — top set (1RM estimé)
              </div>
              <div className="text-[10px] text-muted-subtle tabular-nums">{sessions.length} séance{sessions.length > 1 ? "s" : ""}</div>
            </div>
            <ExerciseProgressionChart sessions={sessions} metric="e1rm" />
          </section>
        </FeatureGate>

        {/* ── Recent sessions ── */}
        <section className="rounded-md border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-secondary">
            <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-semibold">Séances récentes</div>
          </div>
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Aucune séance complétée sur les 90 derniers jours.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {[...sessions].reverse().slice(0, 3).map((s) => (
                <li key={s.completedSessionId} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-foreground">{fmtDate(s.date)}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      Top : <span className="text-foreground font-semibold">{s.topSet.weight}kg × {s.topSet.reps}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.sets.map((set, i) => {
                      const isTop = set.weight === s.topSet.weight && set.reps === s.topSet.reps;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "px-2 py-1 rounded-sm text-[11px] tabular-nums border",
                            isTop
                              ? "border-primary/30 bg-accent text-accent-foreground font-semibold"
                              : "border-border bg-background text-muted-foreground"
                          )}
                        >
                          {set.weight}<span className="opacity-60">×</span>{set.reps}
                          {set.rpe !== null && <span className="ml-1 opacity-60">@{set.rpe}</span>}
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Technique notes ── */}
        {exercise.description && (
          <section className="rounded-md border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-semibold mb-2">Technique</div>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{exercise.description}</p>
          </section>
        )}
      </main>
    </div>
  );
}