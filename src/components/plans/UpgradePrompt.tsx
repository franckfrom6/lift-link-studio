import { useTranslation } from "react-i18next";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PlanBadge from "./PlanBadge";

interface UpgradePromptProps {
  feature: string;
  plan: string;
  compact?: boolean;
}

const UpgradePrompt = ({ feature, plan, compact = false }: UpgradePromptProps) => {
  const { t } = useTranslation("plans");
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        onClick={() => navigate("/pricing")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border shadow-sm hover:shadow transition-shadow"
      >
        <Lock className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
        <PlanBadge plan={plan} />
      </button>
    );
  }

  return (
    <div className="glass p-5 text-center space-y-3">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto">
        <Lock className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-semibold text-sm">
          {t("feature_locked", { plan: t(`plan_${plan}`) })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t(`feature_desc_${feature}`, t("feature_upgrade_desc"))}
        </p>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button size="sm" onClick={() => navigate("/pricing")}>
          {t("view_plans")}
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default UpgradePrompt;
