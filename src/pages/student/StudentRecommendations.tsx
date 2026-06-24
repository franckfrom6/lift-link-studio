import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import StudentRecommendationCards from "@/components/student/StudentRecommendationCards";
import { ClipboardList, ChevronLeft } from "lucide-react";
import FeatureGate from "@/components/plans/FeatureGate";

const StudentRecommendations = () => {
  const { t } = useTranslation("recommendations");
  const navigate = useNavigate();

  return (
    <FeatureGate feature="recovery_recommendations" showLocked>
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors h-11 w-11 -ml-3 justify-center"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <ClipboardList className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
        </div>
        <StudentRecommendationCards type="all" />
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">{t("no_recommendations_desc")}</p>
        </div>
      </div>
    </FeatureGate>
  );
};

export default StudentRecommendations;
