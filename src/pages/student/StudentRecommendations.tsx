import { useTranslation } from "react-i18next";
import StudentRecommendationCards from "@/components/student/StudentRecommendationCards";
import { ClipboardList } from "lucide-react";

const StudentRecommendations = () => {
  const { t } = useTranslation("recommendations");

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <StudentRecommendationCards type="all" />
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">{t("no_recommendations_desc")}</p>
      </div>
    </div>
  );
};

export default StudentRecommendations;
