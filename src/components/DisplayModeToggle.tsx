import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { useTranslation } from "react-i18next";
import { Zap, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DisplayModeToggle = () => {
  const { mode, toggle } = useDisplayMode();
  const { t } = useTranslation("common");
  const isPro = mode === "advanced";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isPro
              ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              : "bg-secondary text-muted-foreground border-border hover:bg-accent"
          }`}
          aria-label={isPro ? t("mode_simple") : t("mode_pro")}
        >
          {isPro ? (
            <Zap className="w-3.5 h-3.5" strokeWidth={2} />
          ) : (
            <Target className="w-3.5 h-3.5" strokeWidth={2} />
          )}
          <span className="hidden sm:inline">{isPro ? t("mode_pro") : t("mode_simple")}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{t("mode_toggle_tooltip")}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default DisplayModeToggle;
