import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/providers/PlanProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Save } from "lucide-react";
import PlanBadge from "@/components/plans/PlanBadge";

interface FeatureRow {
  id?: string;
  plan_id: string;
  feature_key: string;
  is_enabled: boolean;
  limit_value: number | null;
  limit_type: string | null;
}

const AdminFeatures = () => {
  const { t, i18n } = useTranslation("admin");
  const { allPlans, refetch } = usePlan();
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [planSubscriberCounts, setPlanSubscriberCounts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const featureKeys = Object.keys(
    (i18n.getResourceBundle(i18n.language, "admin") as any)?.features || {}
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("plan_features").select("*");
      setFeatures(data || []);

      const { data: subs } = await supabase.from("user_subscriptions").select("plan_id");
      const counts: Record<string, number> = {};
      (subs || []).forEach((s: any) => { counts[s.plan_id] = (counts[s.plan_id] || 0) + 1; });
      setPlanSubscriberCounts(counts);
    };
    fetchData();
  }, []);

  const getFeature = (planId: string, featureKey: string): FeatureRow => {
    return features.find((f) => f.plan_id === planId && f.feature_key === featureKey) || {
      plan_id: planId,
      feature_key: featureKey,
      is_enabled: false,
      limit_value: null,
      limit_type: null,
    };
  };

  const updateFeature = (planId: string, featureKey: string, updates: Partial<FeatureRow>) => {
    setFeatures((prev) => {
      const idx = prev.findIndex((f) => f.plan_id === planId && f.feature_key === featureKey);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updates };
        return copy;
      }
      return [...prev, { plan_id: planId, feature_key: featureKey, is_enabled: false, limit_value: null, limit_type: null, ...updates }];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const feat of features) {
        if (feat.id) {
          await supabase.from("plan_features").update({
            is_enabled: feat.is_enabled,
            limit_value: feat.limit_value,
            limit_type: feat.limit_type,
          }).eq("id", feat.id);
        } else {
          await supabase.from("plan_features").insert({
            plan_id: feat.plan_id,
            feature_key: feat.feature_key,
            is_enabled: feat.is_enabled,
            limit_value: feat.limit_value,
            limit_type: feat.limit_type,
          });
        }
      }
      toast.success(t("saved"));
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const getFeatureLabel = (key: string) => t(`features.${key}`, { defaultValue: key });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{t("features_plans")}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1" /> {t("save")}
        </Button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allPlans.map((plan: any) => (
          <Card key={plan.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {i18n.language === "fr" ? plan.displayNameFr : plan.displayNameEn}
                </CardTitle>
                <PlanBadge plan={plan.name} showTooltip={false} />
              </div>
              <p className="text-xs text-muted-foreground">
                {plan.priceMonthly ? `${plan.priceMonthly}€${t("per_month")}` : t("free_label")}
                {" · "}
                {planSubscriberCounts[plan.id] || 0} {t("subscribers")}
              </p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Feature matrix */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium min-w-[200px]">{t("feature_key")}</th>
                {allPlans.map((plan: any) => (
                  <th key={plan.id} className="text-center p-3 font-medium min-w-[140px]">
                    <PlanBadge plan={plan.name} showTooltip={false} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {featureKeys.map((key) => (
                <tr key={key} className="hover:bg-muted/30">
                  <td className="p-3">
                    <span className="font-medium">{getFeatureLabel(key)}</span>
                    <span className="block text-[10px] font-mono text-muted-foreground">{key}</span>
                  </td>
                  {allPlans.map((plan: any) => {
                    const feat = getFeature(plan.id, key);
                    return (
                      <td key={plan.id} className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={feat.is_enabled}
                            onCheckedChange={(v) => updateFeature(plan.id, key, { is_enabled: v })}
                          />
                          {feat.is_enabled && (
                            <Input
                              type="number"
                              placeholder={t("unlimited")}
                              value={feat.limit_value ?? ""}
                              onChange={(e) =>
                                updateFeature(plan.id, key, {
                                  limit_value: e.target.value ? parseInt(e.target.value) : null,
                                  limit_type: e.target.value ? "monthly_count" : null,
                                })
                              }
                              className="w-20 h-7 text-xs text-center"
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFeatures;