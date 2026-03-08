import React, { createContext, useContext, useEffect, useState } from "react";
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

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [overrides, setOverrides] = useState<FeatureOverride[]>([]);
  const [allPlans, setAllPlans] = useState<PlanInfo[]>([]);
  const [allPlanFeatures, setAllPlanFeatures] = useState<Record<string, PlanFeature[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchPlanData = React.useCallback(async () => {
    // Always fetch all plans (public data)
    const { data: plans } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    const plansList = (plans || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      displayNameFr: p.display_name_fr,
      displayNameEn: p.display_name_en,
      priceMonthly: p.price_monthly,
      priceYearly: p.price_yearly,
      descriptionFr: p.description_fr,
      descriptionEn: p.description_en,
      sortOrder: p.sort_order,
    }));
    setAllPlans(plansList);

    // Fetch all plan features
    const { data: allFeats } = await supabase
      .from("plan_features")
      .select("*");

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
    setAllPlanFeatures(featsMap);

    if (!user) {
      // Default to free plan
      const freePlan = plansList.find((p: any) => p.name === "free");
      setCurrentPlan(freePlan || null);
      setFeatures(freePlan ? featsMap[freePlan.id] || [] : []);
      setSubscription(null);
      setOverrides([]);
      setLoading(false);
      return;
    }

    // Fetch user subscription
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setSubscription(sub);

    // Determine active plan
    let activePlanId: string | null = null;
    if (sub) {
      const isActive = sub.status === "active" ||
        (sub.status === "trialing" && sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date());
      const isNotExpired = new Date(sub.current_period_end) > new Date();

      if (isActive && isNotExpired) {
        activePlanId = sub.plan_id;
      }
    }

    // Fallback to free plan
    if (!activePlanId) {
      const freePlan = plansList.find((p: any) => p.name === "free");
      activePlanId = freePlan?.id || null;
    }

    const plan = plansList.find((p: any) => p.id === activePlanId) || null;
    setCurrentPlan(plan);
    setFeatures(activePlanId ? featsMap[activePlanId] || [] : []);

    // Fetch overrides
    const { data: ovr } = await supabase
      .from("feature_overrides")
      .select("*")
      .eq("user_id", user.id);

    setOverrides(
      (ovr || [])
        .filter((o: any) => !o.expires_at || new Date(o.expires_at) > new Date())
        .map((o: any) => ({
          featureKey: o.feature_key,
          isEnabled: o.is_enabled,
          expiresAt: o.expires_at,
        }))
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPlanData().catch(console.error);
  }, [fetchPlanData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("plan-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_subscriptions", filter: `user_id=eq.${user.id}` }, () => fetchPlanData().catch(console.error))
      .on("postgres_changes", { event: "*", schema: "public", table: "feature_overrides", filter: `user_id=eq.${user.id}` }, () => fetchPlanData().catch(console.error))
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") console.warn("Plan subscription status:", status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchPlanData]);

  const getFeatureAccess = (featureKey: string): FeatureAccess => {
    if (loading) return { isEnabled: false, limit: null, limitType: null, planRequired: "essential", isLoading: true };

    // Check overrides first
    const override = overrides.find((o) => o.featureKey === featureKey);
    if (override) {
      return { isEnabled: override.isEnabled, limit: null, limitType: null, planRequired: "", isLoading: false };
    }

    // Check plan features
    const feature = features.find((f) => f.featureKey === featureKey);
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
    for (const plan of allPlans) {
      const planFeats = allPlanFeatures[plan.id] || [];
      const feat = planFeats.find((f) => f.featureKey === featureKey);
      if (feat?.isEnabled) {
        minPlan = plan.name;
        break;
      }
    }

    return { isEnabled: false, limit: null, limitType: null, planRequired: minPlan, isLoading: false };
  };

  return (
    <PlanContext.Provider value={{
      currentPlan,
      subscription,
      features,
      overrides,
      allPlans,
      allPlanFeatures,
      loading,
      getFeatureAccess,
      refetch: fetchPlanData,
    }}>
      {children}
    </PlanContext.Provider>
  );
};
