import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlanInfo {
  id: string;
  name: string;
  displayNameFr: string;
  displayNameEn: string;
}

interface PlanFeature {
  featureKey: string;
  isEnabled: boolean;
  limitValue: number | null;
  limitType: string | null;
}

interface FeatureOverride {
  featureKey: string;
  isEnabled: boolean;
  expiresAt: string | null;
}

interface FeatureAccess {
  isEnabled: boolean;
  limit: number | null;
  limitType: string | null;
  planRequired: string;
  isLoading: boolean;
}

interface PlanContextType {
  currentPlan: PlanInfo | null;
  subscription: any | null;
  features: PlanFeature[];
  overrides: FeatureOverride[];
  allPlans: PlanInfo[];
  allPlanFeatures: Record<string, PlanFeature[]>;
  loading: boolean;
  getFeatureAccess: (featureKey: string) => FeatureAccess;
  refetch: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
};

export const useFeatureAccess = (featureKey: string): FeatureAccess => {
  const { getFeatureAccess } = usePlan();
  return getFeatureAccess(featureKey);
};

export const useCurrentPlan = () => {
  const { currentPlan, subscription, loading } = usePlan();
  return { plan: currentPlan, subscription, loading };
};

interface PlanData {
  currentPlan: PlanInfo | null;
  subscription: any | null;
  features: PlanFeature[];
  overrides: FeatureOverride[];
  allPlans: PlanInfo[];
  allPlanFeatures: Record<string, PlanFeature[]>;
}

async function fetchPlanData(userId: string | null): Promise<PlanData> {
  // Always fetch plans (public, cached)
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const plansList: PlanInfo[] = (plans || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    displayNameFr: p.display_name_fr,
    displayNameEn: p.display_name_en,
  }));

  if (!userId) {
    const freePlan = plansList.find((p) => p.name === "free") || null;
    const freeFeatures = await fetchPlanFeatures(freePlan?.id || null);
    return {
      currentPlan: freePlan,
      subscription: null,
      features: freeFeatures,
      overrides: [],
      allPlans: plansList,
      allPlanFeatures: freePlan ? { [freePlan.id]: freeFeatures } : {},
    };
  }

  // Fetch user-specific data in parallel
  const [subRes, overridesRes] = await Promise.all([
    supabase.from("user_subscriptions").select("*").eq("user_id", userId).single(),
    supabase.from("feature_overrides").select("*").eq("user_id", userId),
  ]);

  const sub = subRes.data;
  let activePlanId: string | null = null;

  if (sub) {
    const isActive = sub.status === "active" ||
      (sub.status === "trialing" && sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date());
    const isNotExpired = new Date(sub.current_period_end) > new Date();
    if (isActive && isNotExpired) activePlanId = sub.plan_id;
  }

  if (!activePlanId) {
    activePlanId = plansList.find((p) => p.name === "free")?.id || null;
  }

  const plan = plansList.find((p) => p.id === activePlanId) || null;

  // Fetch only features for the active plan (not all plans)
  const features = await fetchPlanFeatures(activePlanId);

  // For getFeatureAccess "find minimum plan" we still need all plan features
  const { data: allFeats } = await supabase.from("plan_features").select("*");
  const featsMap: Record<string, PlanFeature[]> = {};
  (allFeats || []).forEach((f: any) => {
    if (!featsMap[f.plan_id]) featsMap[f.plan_id] = [];
    featsMap[f.plan_id].push({
      featureKey: f.feature_key,
      isEnabled: f.is_enabled,
      limitValue: f.limit_value,
      limitType: f.limit_type,
    });
  });

  const overrides: FeatureOverride[] = (overridesRes.data || [])
    .filter((o: any) => !o.expires_at || new Date(o.expires_at) > new Date())
    .map((o: any) => ({
      featureKey: o.feature_key,
      isEnabled: o.is_enabled,
      expiresAt: o.expires_at,
    }));

  return {
    currentPlan: plan,
    subscription: sub,
    features,
    overrides,
    allPlans: plansList,
    allPlanFeatures: featsMap,
  };
}

async function fetchPlanFeatures(planId: string | null): Promise<PlanFeature[]> {
  if (!planId) return [];
  const { data } = await supabase
    .from("plan_features")
    .select("*")
    .eq("plan_id", planId);
  return (data || []).map((f: any) => ({
    featureKey: f.feature_key,
    isEnabled: f.is_enabled,
    limitValue: f.limit_value,
    limitType: f.limit_type,
  }));
}

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["plan-data", user?.id || "anon"],
    queryFn: () => fetchPlanData(user?.id || null),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Realtime subscriptions for user-specific changes
  useEffect(() => {
    if (!user) return;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["plan-data", user.id] });

    const channel = supabase
      .channel("plan-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_subscriptions", filter: `user_id=eq.${user.id}` }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "feature_overrides", filter: `user_id=eq.${user.id}` }, invalidate)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const getFeatureAccess = (featureKey: string): FeatureAccess => {
    if (isLoading || !data) return { isEnabled: false, limit: null, limitType: null, planRequired: "essential", isLoading: true };

    // Check overrides first
    const override = data.overrides.find((o) => o.featureKey === featureKey);
    if (override) {
      return { isEnabled: override.isEnabled, limit: null, limitType: null, planRequired: "", isLoading: false };
    }

    // Check plan features
    const feature = data.features.find((f) => f.featureKey === featureKey);
    if (feature) {
      return {
        isEnabled: feature.isEnabled,
        limit: feature.limitValue,
        limitType: feature.limitType,
        planRequired: "",
        isLoading: false,
      };
    }

    // Find minimum plan that enables this feature
    let minPlan = "advanced";
    for (const plan of data.allPlans) {
      const planFeats = data.allPlanFeatures[plan.id] || [];
      const feat = planFeats.find((f) => f.featureKey === featureKey);
      if (feat?.isEnabled) {
        minPlan = plan.name;
        break;
      }
    }

    return { isEnabled: false, limit: null, limitType: null, planRequired: minPlan, isLoading: false };
  };

  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ["plan-data"] });
  };

  return (
    <PlanContext.Provider value={{
      currentPlan: data?.currentPlan || null,
      subscription: data?.subscription || null,
      features: data?.features || [],
      overrides: data?.overrides || [],
      allPlans: data?.allPlans || [],
      allPlanFeatures: data?.allPlanFeatures || {},
      loading: isLoading,
      getFeatureAccess,
      refetch,
    }}>
      {children}
    </PlanContext.Provider>
  );
};
