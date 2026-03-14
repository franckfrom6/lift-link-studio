import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingContextType {
  hasSeenStep: (key: string) => boolean;
  markStepSeen: (key: string) => Promise<void>;
  dismissStep: (key: string) => void;
  steps: Record<string, boolean>;
  completedCount: number;
  totalSteps: number;
}

const STEP_KEYS = [
  "welcome_seen",
  "program_seen",
  "session_started",
  "timer_seen",
  "session_builder_seen",
  "nutrition_seen",
  "checkin_seen",
  "coach_invite_seen",
];

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [steps, setSteps] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile) {
      const saved = (profile as any).onboarding_steps || {};
      setSteps(saved);
    }
  }, [profile]);

  const hasSeenStep = useCallback(
    (key: string) => {
      return !!steps[key] || dismissed.has(key);
    },
    [steps, dismissed]
  );

  const markStepSeen = useCallback(
    async (key: string) => {
      if (!user) return;
      const updated = { ...steps, [key]: true };
      setSteps(updated);
      await supabase
        .from("profiles")
        .update({ onboarding_steps: updated } as any)
        .eq("user_id", user.id);
    },
    [user, steps]
  );

  const dismissStep = useCallback((key: string) => {
    setDismissed((prev) => new Set(prev).add(key));
  }, []);

  const completedCount = STEP_KEYS.filter((k) => steps[k]).length;

  return (
    <OnboardingContext.Provider
      value={{ hasSeenStep, markStepSeen, dismissStep, steps, completedCount, totalSteps: STEP_KEYS.length }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
