import { useTranslation } from "react-i18next";
import WeeklySummaryCard from "@/components/student/WeeklySummaryCard";
import StrengthProgressChart from "@/components/student/StrengthProgressChart";
import BodyEvolutionSection from "@/components/student/BodyEvolutionSection";
import ProgressPhotoGallery from "@/components/student/ProgressPhotoGallery";
import WeeklyInsightCard from "@/components/student/WeeklyInsightCard";
import FeatureGate from "@/components/plans/FeatureGate";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";

const StudentProgress = () => {
  const { t } = useTranslation("dashboard");
  const isAdvanced = useIsAdvanced();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("stats")}</h1>
        <p className="text-muted-foreground text-sm">{t("track_progress")}</p>
      </div>

      <FeatureGate feature="ai_weekly_insight" showLocked>
        <WeeklyInsightCard />
      </FeatureGate>

      <WeeklySummaryCard />

      {/* Simple: simplified weight chart only. Pro: full strength progress with volume toggle */}
      <StrengthProgressChart />

      {/* Body evolution & photos — Pro only */}
      {isAdvanced && <BodyEvolutionSection />}

      {isAdvanced && (
        <FeatureGate feature="progress_photos" showLocked>
          <ProgressPhotoGallery />
        </FeatureGate>
      )}
    </div>
  );
};

export default StudentProgress;
