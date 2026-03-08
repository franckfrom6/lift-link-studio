import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PlanBadgeProps {
  plan: string;
  showTooltip?: boolean;
}

const planStyles: Record<string, string> = {
  essential: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  advanced: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};

const PlanBadge = ({ plan, showTooltip = true }: PlanBadgeProps) => {
  const { t } = useTranslation("plans");

  if (plan === "free") return null;

  const badge = (
    <Badge variant="outline" className={`text-[9px] font-semibold ${planStyles[plan] || planStyles.essential}`}>
      {t(`plan_${plan}`)}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{t("available_with", { plan: t(`plan_${plan}`) })}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default PlanBadge;
