import { useTranslation } from "react-i18next";
import { Dumbbell, TrendingUp } from "lucide-react";

interface TeammateComparisonProps {
  yourVolume: number;
  yourSets: number;
  teammateName: string;
  teammateVolume: number;
  teammateSets: number;
}

const TeammateComparison = ({ yourVolume, yourSets, teammateName, teammateVolume, teammateSets }: TeammateComparisonProps) => {
  const { t } = useTranslation("teammate");

  return (
    <div className="glass p-4 space-y-3">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-accent-foreground" strokeWidth={1.5} />
        {t("comparison_title")}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-primary">{t("you")}</p>
          <div className="flex items-center justify-center gap-1 text-lg font-bold">
            <Dumbbell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            {Math.round(yourVolume).toLocaleString()}
          </div>
          <p className="text-[10px] text-muted-foreground">{yourSets} {t("sets")}</p>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-accent-foreground">{teammateName}</p>
          <div className="flex items-center justify-center gap-1 text-lg font-bold">
            <Dumbbell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            {Math.round(teammateVolume).toLocaleString()}
          </div>
          <p className="text-[10px] text-muted-foreground">{teammateSets} {t("sets")}</p>
        </div>
      </div>
    </div>
  );
};

export default TeammateComparison;
