import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LimitReachedBannerProps {
  feature: string;
  current: number;
  limit: number;
}

const LimitReachedBanner = ({ feature, current, limit }: LimitReachedBannerProps) => {
  const { t } = useTranslation("plans");
  const navigate = useNavigate();

  return (
    <div className="glass p-4 border-warning/30 bg-warning-bg/50 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-warning" strokeWidth={1.5} />
        <span className="font-semibold text-sm">{t("limit_reached")}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("limit_description", { current, limit })}
      </p>
      <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>
        {t("upgrade")}
        <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
};

export default LimitReachedBanner;
