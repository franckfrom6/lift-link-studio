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

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  essential: {
    generate_program: 5,
    suggest_alternatives: 30,
    suggest_exercise: 30,
    estimate_macros: 60,
    recovery_recommendation: 30,
    generate_recommendation: 20,
  },
  advanced: {
    generate_program: 50,
    suggest_alternatives: -1,
    suggest_exercise: -1,
    analyze_week: 30,
    cycle_report: 10,
    optimize_week: 30,
    estimate_macros: -1,
    suggest_meal: -1,
    recovery_recommendation: -1,
    weekly_insight: -1,
    generate_recommendation: -1,
  },
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
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("plan_id, plans(name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const plan = (sub as any)?.plans?.name || "free";
    setPlanName(plan);

    if (plan === "free") {
      setUsage([]);
      setLoading(false);
      return;
    }

    // Get usage this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: logs } = await supabase
      .from("ai_usage_logs")
      .select("action")
      .eq("user_id", user.id)
      .eq("status", "success")
      .gte("created_at", startOfMonth.toISOString());

    const limits = PLAN_LIMITS[plan] || {};
    const counts: Record<string, number> = {};
    logs?.forEach((l: any) => {
      counts[l.action] = (counts[l.action] || 0) + 1;
    });

    const entries: UsageEntry[] = Object.entries(limits).map(([action, limit]) => ({
      action,
      count: counts[action] || 0,
      limit: limit as number,
    }));

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
                    <Badge variant="secondary" className="text-[10px]">∞</Badge>
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
