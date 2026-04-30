import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, History, Share2, ImageIcon } from "lucide-react";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { useStudentProgram } from "@/hooks/useStudentProgram";
import { useWeeklyVolumeSeries, ProgPeriod } from "@/hooks/useWeeklyVolumeSeries";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import FeatureGate from "@/components/plans/FeatureGate";
import WeeklyInsightCard from "@/components/student/WeeklyInsightCard";
import BodyEvolutionSection from "@/components/student/BodyEvolutionSection";
import ProgressPhotoGallery from "@/components/student/ProgressPhotoGallery";
import ProgKPICard, { ProgKPI } from "@/components/student/progression/ProgKPICard";
import ProgVolumeChart from "@/components/student/progression/ProgVolumeChart";
import ProgSection from "@/components/student/progression/ProgSection";
import ProgEmptyState from "@/components/student/progression/ProgEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PERIODS: { id: ProgPeriod; label: string }[] = [
  { id: "4w", label: "4 sem." },
  { id: "12w", label: "12 sem." },
  { id: "1y", label: "Année" },
];

const StudentProgress = () => {
  const { t } = useTranslation("dashboard");
  const isAdvanced = useIsAdvanced();
  const { summary, loading: summaryLoading } = useStudentDashboard();
  const { program } = useStudentProgram();
  const [period, setPeriod] = useState<ProgPeriod>("12w");
  const { series, loading: volLoading } = useWeeklyVolumeSeries(period);

  // Mésocycle / week label for the header subtitle
  const headerCaption = useMemo(() => {
    if (!program || !program.weeks?.length) return "Suivi athlète";
    const totalWeeks = program.weeks.length;
    return `${program.name} · ${totalWeeks} sem.`;
  }, [program]);

  // KPIs (2×2 grid) — always visible in both modes
  const kpis: ProgKPI[] = useMemo(() => {
    if (!summary) return [];
    const sessionDelta = summary.programmedDone - 0; // baseline placeholder
    const volCurrent = series.current;
    const volPrev = series.previous;
    const volDeltaPct =
      volPrev > 0 ? Math.round(((volCurrent - volPrev) / volPrev) * 100) : 0;
    const consistency =
      summary.programmedTotal > 0
        ? Math.round((summary.programmedDone / summary.programmedTotal) * 100)
        : 0;
    return [
      {
        id: "sessions",
        label: "Séances",
        value: `${summary.programmedDone}`,
        unit: `/ ${summary.programmedTotal || "—"}`,
        delta: summary.externalCount > 0 ? `+${summary.externalCount}` : undefined,
        sub: summary.externalCount > 0 ? "ext." : "cette sem.",
        deltaTone: summary.externalCount > 0 ? "up" : "neutral",
      },
      {
        id: "volume",
        label: "Volume sem.",
        value:
          volCurrent >= 1000
            ? (volCurrent / 1000).toFixed(1)
            : volCurrent.toFixed(0),
        unit: volCurrent >= 1000 ? "k kg" : "kg",
        delta: volDeltaPct !== 0 ? `${volDeltaPct > 0 ? "+" : ""}${volDeltaPct}%` : undefined,
        sub: volDeltaPct !== 0 ? "vs S-1" : "vs S-1",
        deltaTone: volDeltaPct > 0 ? "up" : "neutral",
      },
      {
        id: "consistency",
        label: "Régularité",
        value: `${consistency}`,
        unit: "%",
        sub: "du programme",
        deltaTone: "neutral",
      },
      {
        id: "nutrition",
        label: "Nutrition",
        value: `${summary.nutritionDaysLogged}`,
        unit: `/ ${summary.totalDays}j`,
        sub: "loggés",
        deltaTone: "neutral",
      },
    ];
  }, [summary, series]);

  // Loading skeleton
  if (summaryLoading) {
    return (
      <div className="max-w-2xl mx-auto pb-32 md:pb-6 animate-fade-in">
        <div className="px-4 pt-4 pb-3 border-b border-border space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[78px] rounded-md" />
          ))}
        </div>
        <Skeleton className="mx-4 h-[180px] rounded-md" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-32 md:pb-6 animate-fade-in">
      {/* Sage header — eyebrow + title + share */}
      <header className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-subtle mb-0.5 truncate">
            {headerCaption}
          </p>
          <h1 className="text-lg font-bold tracking-tight text-foreground m-0">
            {t("stats")}
          </h1>
        </div>
        <button
          type="button"
          className="w-8 h-8 rounded-sm bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Partager"
          title="Partage bientôt disponible"
        >
          <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </header>

      {/* Period tabs */}
      <div className="px-4 pt-3 pb-1 flex gap-1.5">
        {PERIODS.map((p) => {
          const on = p.id === period;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "flex-1 px-2.5 py-2 rounded-sm text-[12px] font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                on
                  ? "border border-primary bg-accent-tint text-accent-on-tint"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={on}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* AI weekly insight (Pro only) */}
      {isAdvanced && (
        <div className="px-4 pt-3">
          <FeatureGate feature="ai_weekly_insight" showLocked>
            <WeeklyInsightCard />
          </FeatureGate>
        </div>
      )}

      {/* KPI grid 2×2 */}
      <div className="px-4 pt-3 pb-1 grid grid-cols-2 gap-2.5">
        {kpis.map((k) => (
          <ProgKPICard key={k.id} kpi={k} />
        ))}
      </div>

      {/* Volume chart */}
      {volLoading ? (
        <div className="px-4 py-3">
          <Skeleton className="h-[180px] rounded-md" />
        </div>
      ) : (
        <ProgVolumeChart
          title={`Volume — ${PERIODS.find((p) => p.id === period)?.label}`}
          unit="kg total"
          current={series.current}
          delta={
            series.previous > 0
              ? `${Math.round(
                  ((series.current - series.previous) / series.previous) * 100
                )}%`
              : undefined
          }
          points={series.points}
          labelStart={
            period === "4w" ? "S-3" : period === "12w" ? "S-11" : "S-51"
          }
          labelEnd="Cette sem."
        />
      )}

      {/* Records récents — placeholder élégant */}
      <ProgSection title="Records récents">
        <ProgEmptyState
          icon={Trophy}
          title="Aucun record détecté pour l'instant"
          description="Continue à logger tes séances : tes meilleurs lifts s'afficheront automatiquement ici."
        />
      </ProgSection>

      {/* Mensurations + photos — Pro only */}
      {isAdvanced ? (
        <>
          <ProgSection title="Mensurations">
            <BodyEvolutionSection />
          </ProgSection>

          <FeatureGate feature="progress_photos" showLocked>
            <ProgSection title="Photos">
              <ProgressPhotoGallery />
            </ProgSection>
          </FeatureGate>
        </>
      ) : (
        <ProgSection title="Mensurations">
          <ProgEmptyState
            icon={ImageIcon}
            title="Disponible en mode Pro"
            description="Active le mode Pro pour suivre poids, masse grasse et photos de progression."
          />
        </ProgSection>
      )}

      {/* Historique — placeholder */}
      <ProgSection title="Historique">
        <ProgEmptyState
          icon={History}
          title="Bientôt disponible"
          description="L'historique détaillé de tes séances arrivera dans une prochaine mise à jour."
        />
      </ProgSection>
    </div>
  );
};

export default StudentProgress;
