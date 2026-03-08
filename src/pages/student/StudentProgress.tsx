import { useTranslation } from "react-i18next";
import WeeklySummaryCard from "@/components/student/WeeklySummaryCard";
import StrengthProgressChart from "@/components/student/StrengthProgressChart";
import BodyEvolutionSection from "@/components/student/BodyEvolutionSection";
import ProgressPhotoGallery from "@/components/student/ProgressPhotoGallery";

const StudentProgress = () => {
  const { t } = useTranslation("dashboard");

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("stats")}</h1>
        <p className="text-muted-foreground text-sm">{t("track_progress")}</p>
      </div>

      <WeeklySummaryCard />
      <StrengthProgressChart />
      <BodyEvolutionSection />
      <ProgressPhotoGallery />
    </div>
  );
};

export default StudentProgress;
