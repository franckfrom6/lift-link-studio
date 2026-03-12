import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

interface UsageEntry {
  action: string;
  count: number;
  limit: number;
}

const ACTION_LABELS: Record<string, { fr: string; en: string }> = {
  generate_program: { fr: "Génération de programmes", en: "Program generation" },
  suggest_alternatives: { fr: "Alternatives exercices", en: "Exercise alternatives" },
  suggest_exercise: { fr: "Suggestion en séance", en: "In-session suggestion" },
  analyze_week: { fr: "Analyse hebdo", en: "Weekly analysis" },
  cycle_report: { fr: "Bilan de cycle", en: "Cycle report" },
  optimize_week: { fr: "Optimisation semaine", en: "Week optimization" },
  estimate_macros: { fr: "Estimation macros", en: "Macro estimation" },
  suggest_meal: { fr: "Suggestion repas", en: "Meal suggestion" },
  recovery_recommendation: { fr: "Reco récupération", en: "Recovery recommendation" },
  weekly_insight: { fr: "Insight hebdo", en: "Weekly insight" },
  generate_recommendation: { fr: "Rédaction reco", en: "Recommendation writing" },
};

const AIUsageDashboard = () => {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [planName, setPlanName] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadUsage();
  }, [user]);

  const loadUsage = async () => {
    if (!user) return;
    setLoading(true);

    // Get plan
    const { data: sub, error: subError } = await supabase
      .from("user_subscriptions")
      .select("plan_id, plans(name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError) console.error("Error fetching subscription:", subError);

    const plan = (sub as any)?.plans?.name || "free";
    setPlanName(plan);

    if (plan === "free") {
      setUsage([]);
      setLoading(false);
      return;
    }

    // Get plan features (limits) from DB
    const { data: planRow } = await supabase
      .from("plans")
      .select("id")
      .eq("name", plan)
      .maybeSingle();

    let featureLimits: Record<string, number> = {};
    if (planRow) {
      const { data: features } = await supabase
        .from("plan_features")
        .select("feature_key, limit_value, is_enabled")
        .eq("plan_id", planRow.id);
      if (features) {
        for (const f of features) {
          if (f.is_enabled && f.feature_key.startsWith("ai_")) {
            // Map feature_key "ai_generate_program" -> action "generate_program"
            const action = f.feature_key.replace(/^ai_/, "");
            featureLimits[action] = f.limit_value ?? -1;
          }
        }
      }
    }

    // Get usage this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: logs, error: logsError } = await supabase
      .from("ai_usage_logs")
      .select("action")
      .eq("user_id", user.id)
      .eq("status", "success")
      .gte("created_at", startOfMonth.toISOString());
    if (logsError) console.error("Error fetching AI usage:", logsError);

    const counts: Record<string, number> = {};
    logs?.forEach((l: any) => {
      counts[l.action] = (counts[l.action] || 0) + 1;
    });

    // Build entries from DB limits, fallback to usage actions if no limits found
    const entries: UsageEntry[] = Object.entries(featureLimits).map(([action, limit]) => ({
      action,
      count: counts[action] || 0,
      limit,
    }));

    // If no DB limits found, show all used actions without limits
    if (entries.length === 0 && Object.keys(counts).length > 0) {
      for (const [action, count] of Object.entries(counts)) {
        entries.push({ action, count, limit: -1 });
      }
    }

    setUsage(entries);
    setLoading(false);
  };

  if (loading || planName === "free") return null;

  const lang = i18n.language === "fr" ? "fr" : "en";
  const monthName = new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "long", year: "numeric" });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          {lang === "fr" ? `Usage IA — ${monthName}` : `AI Usage — ${monthName}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {usage.map((u) => {
          const label = ACTION_LABELS[u.action]?.[lang] || u.action;
          const isUnlimited = u.limit === -1;
          const pct = isUnlimited ? 0 : u.limit > 0 ? Math.min((u.count / u.limit) * 100, 100) : 0;
          const isWarning = !isUnlimited && pct >= 80;
          const isDanger = !isUnlimited && pct >= 100;

          return (
            <div key={u.action} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${isDanger ? "text-destructive" : isWarning ? "text-yellow-600" : ""}`}>
                  {isUnlimited ? (
                    <Badge variant="secondary" className="text-xs">∞</Badge>
                  ) : (
                    `${u.count}/${u.limit}`
                  )}
                </span>
              </div>
              {!isUnlimited && (
                <Progress
                  value={pct}
                  className={`h-1.5 ${isDanger ? "[&>div]:bg-destructive" : isWarning ? "[&>div]:bg-yellow-500" : ""}`}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AIUsageDashboard;
