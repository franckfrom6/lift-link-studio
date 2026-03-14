import { AlertTriangle, Eye, Target, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StudentDisplayModeBannerProps {
  displayMode: "simple" | "advanced" | null;
  studentName: string;
}

const StudentDisplayModeBanner = ({ displayMode, studentName }: StudentDisplayModeBannerProps) => {
  const { t } = useTranslation(["dashboard", "common"]);
  const isSimple = !displayMode || displayMode === "simple";

  if (!isSimple) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-warning-bg border border-warning/20">
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        <Eye className="w-4 h-4 text-warning" strokeWidth={1.5} />
        <Target className="w-3.5 h-3.5 text-warning" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {studentName} {t("dashboard:uses_simple_mode", "utilise le mode Simple")}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {t("dashboard:simple_mode_hidden", "Cet athlète ne voit pas : tempo, RPE, graphiques de volume, évolution corporelle, photos de progression.")}
        </p>
      </div>
    </div>
  );
};

export default StudentDisplayModeBanner;
