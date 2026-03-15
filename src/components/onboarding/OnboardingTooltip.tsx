import { useEffect, useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTranslation } from "react-i18next";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingTooltipProps {
  stepKey: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "center";
  ctaLabel?: string;
  ctaAction?: () => void;
}

const OnboardingTooltip = ({
  stepKey,
  title,
  description,
  position = "bottom",
  ctaLabel,
  ctaAction,
}: OnboardingTooltipProps) => {
  const { t } = useTranslation("common");
  const { hasSeenStep, markStepSeen, dismissStep } = useOnboarding();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasSeenStep(stepKey)) {
      // Delay slightly to avoid stacking on mount
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [stepKey, hasSeenStep]);

  if (!visible) return null;

  const handleConfirm = async () => {
    setVisible(false);
    await markStepSeen(stepKey);
    ctaAction?.();
  };

  const handleDismiss = () => {
    setVisible(false);
    dismissStep(stepKey);
  };

  return (
    <div className="fixed inset-0 z-[45] flex items-end sm:items-center justify-center animate-in fade-in duration-300">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={handleDismiss} />

      {/* Card */}
      <div
        className={cn(
          "relative z-10 mx-4 mb-4 sm:mb-0 w-full max-w-sm",
          "bg-card border border-border rounded-2xl shadow-xl p-5",
          "animate-in slide-in-from-bottom-4 duration-300",
          position === "top" && "sm:mb-auto sm:mt-24",
          position === "center" && ""
        )}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-bold text-base pr-6">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>

        <Button onClick={handleConfirm} className="w-full mt-4 gap-1.5" size="sm">
          <Check className="w-3.5 h-3.5" />
          {ctaLabel || t("onboarding_got_it")}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingTooltip;
