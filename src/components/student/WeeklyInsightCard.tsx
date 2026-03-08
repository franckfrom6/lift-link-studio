import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X, Sparkles } from "lucide-react";

const CACHE_KEY = "weekly_insight_cache";

interface CachedInsight {
  message: string;
  emoji: string;
  weekKey: string;
  dismissed: boolean;
}

const getWeekKey = () => {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  return monday.toISOString().split("T")[0];
};

const WeeklyInsightCard = () => {
  const { t, i18n } = useTranslation("dashboard");
  const { user } = useAuth();
  const [insight, setInsight] = useState<{ message: string; emoji: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;

    const weekKey = getWeekKey();
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: CachedInsight = JSON.parse(cached);
        if (parsed.weekKey === weekKey) {
          if (parsed.dismissed) {
            setDismissed(true);
            return;
          }
          setInsight({ message: parsed.message, emoji: parsed.emoji });
          return;
        }
      } catch {}
    }

    fetchInsight(weekKey);
  }, [user]);

  const fetchInsight = async (weekKey: string) => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-coach", {
        body: {
          action: "weekly_insight",
          payload: { student_id: user.id },
          lang: i18n.language,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        // Silently fail for plan/rate limit errors on insight
        if (data.error === "plan_required" || data.error === "rate_limited") {
          setError(true);
          return;
        }
        throw new Error(data.error);
      }

      setInsight({ message: data.message, emoji: data.emoji });
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        message: data.message,
        emoji: data.emoji,
        weekKey,
        dismissed: false,
      }));
    } catch (err) {
      console.error("Weekly insight error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    const weekKey = getWeekKey();
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.dismissed = true;
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      } catch {}
    }
  };

  if (dismissed || error || (!loading && !insight)) return null;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t("generating_insight", "Génération de ton résumé...")}</span>
          </div>
        ) : insight ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{t("weekly_insight_title", "Résumé de ta semaine")}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-sm leading-relaxed">
              <span className="text-lg mr-1">{insight.emoji}</span>
              {insight.message}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default WeeklyInsightCard;
