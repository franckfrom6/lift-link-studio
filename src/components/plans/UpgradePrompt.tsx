import { useTranslation } from "react-i18next";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
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
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm hover:shadow-md hover:bg-primary/15 transition-all group"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" strokeWidth={1.5} />
        <span className="text-xs font-semibold text-primary">{t("upgrade")}</span>
        <PlanBadge plan={plan} />
      </button>
    );
  }

  return (
    <div className="glass p-6 text-center space-y-4 border border-primary/10">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <Lock className="w-5 h-5 text-primary" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <p className="font-bold text-sm">
          {t("feature_locked", { plan: t(`plan_${plan}`) })}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
          {t(`feature_desc_${feature}`, t("feature_upgrade_desc"))}
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => navigate("/pricing")}
        className="gap-2 px-5 rounded-xl shadow-md hover:shadow-lg transition-shadow"
      >
        <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
        {t("upgrade")}
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default UpgradePrompt;
