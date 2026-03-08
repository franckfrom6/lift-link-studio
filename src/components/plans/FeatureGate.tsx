import React from "react";
import { useFeatureAccess } from "@/providers/PlanProvider";
import UpgradePrompt from "./UpgradePrompt";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** If true, show children but disabled/locked visual */
  showLocked?: boolean;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback, showLocked = false }) => {
  const { isEnabled, isLoading, planRequired } = useFeatureAccess(feature);

  if (isLoading) return null;

  if (isEnabled) return <>{children}</>;

  if (showLocked) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl backdrop-blur-[1px]">
          <UpgradePrompt feature={feature} plan={planRequired} compact />
        </div>
      </div>
    );
  }

  return <>{fallback || <UpgradePrompt feature={feature} plan={planRequired} />}</>;
};

export default FeatureGate;
