import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, AlertTriangle, Check, X, Pencil, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIAdaptationViewProps {
  studentId: string;
  programId: string;
  weekNumber: number;
  studentName: string;
}

interface Adaptation {
  type: string;
  detail: string;
  reason: string;
  priority: string;
  exercise_name?: string;
}

interface PainAlert {
  location: string;
  recommendation: string;
  should_see_professional: boolean;
  frequency?: string;
}

interface AdaptationResult {
  weekly_summary: string;
  load_assessment: string;
  adaptations: Adaptation[];
  pain_alerts: PainAlert[];
  progression_suggestion?: string;
  coach_message_suggestion?: string;
}

const LOAD_COLORS: Record<string, string> = {
  under_stimulated: "text-info bg-info-bg border-info/30",
  optimal: "text-success bg-success-bg border-success/30",
  slightly_high: "text-warning bg-warning-bg border-warning/30",
  overreaching: "text-destructive bg-danger-bg border-destructive/30",
};

const AIAdaptationView = ({ studentId, programId, weekNumber, studentName }: AIAdaptationViewProps) => {
  const { t, i18n } = useTranslation("feedback");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdaptationResult | null>(null);
  const [appliedIndexes, setAppliedIndexes] = useState<Set<number>>(new Set());
  const [ignoredIndexes, setIgnoredIndexes] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("adapt-next-week", {
        body: { student_id: studentId, program_id: programId, week_number: weekNumber, language: i18n.language },
      });
      if (error) throw error;
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Error generating adaptation");
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
        {loading ? t("adapt_loading") : t("adapt_button")}
      </Button>
    );
  }

  const loadClass = LOAD_COLORS[result.load_assessment] || LOAD_COLORS.optimal;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-accent-foreground" />
        <h3 className="font-bold text-sm">{t("adapt_title")} — {t("common:week")} {weekNumber + 1}</h3>
      </div>

      {/* Summary */}
      <div className="glass p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{t("adapt_summary")}</p>
        <p className="text-sm">{result.weekly_summary}</p>
        <Badge variant="outline" className={cn("text-xs", loadClass)}>
          {t("load_assessment")}: {t(`load_${result.load_assessment}`, result.load_assessment)}
        </Badge>
      </div>

      {/* Pain alerts */}
      {result.pain_alerts?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {t("pain_alerts")}
          </p>
          {result.pain_alerts.map((alert, i) => (
            <div key={i} className="glass p-3 border-l-4 border-destructive bg-danger-bg/50 space-y-1">
              <p className="text-sm font-semibold text-destructive">🔴 {alert.location}</p>
              <p className="text-xs">{alert.recommendation}</p>
              {alert.should_see_professional && (
                <p className="text-xs text-destructive font-medium">→ {t("pain_see_professional")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Adaptations */}
      {result.adaptations?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">{t("adaptations_suggested")}</p>
          {result.adaptations.map((adapt, i) => {
            const isApplied = appliedIndexes.has(i);
            const isIgnored = ignoredIndexes.has(i);
            if (isIgnored) return null;

            return (
              <div key={i} className={cn("glass p-3 space-y-2", isApplied && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px]",
                        adapt.priority === "high" ? "text-destructive border-destructive/30" :
                        adapt.priority === "medium" ? "text-warning border-warning/30" : "text-muted-foreground"
                      )}>
                        {adapt.priority}
                      </Badge>
                      <span className="text-xs font-medium">{adapt.type.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm mt-1">{adapt.detail}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{adapt.reason}</p>
                  </div>
                </div>
                {!isApplied && (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => setAppliedIndexes(new Set([...appliedIndexes, i]))}>
                      <Check className="w-3 h-3" /> {t("apply")}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => setIgnoredIndexes(new Set([...ignoredIndexes, i]))}>
                      <X className="w-3 h-3" /> {t("ignore")}
                    </Button>
                  </div>
                )}
                {isApplied && <p className="text-xs text-success">✅ {t("apply")}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Progression suggestion */}
      {result.progression_suggestion && (
        <div className="glass p-3">
          <p className="text-xs text-muted-foreground mb-1">💡 Progression</p>
          <p className="text-sm">{result.progression_suggestion}</p>
        </div>
      )}

      {/* Coach message */}
      {result.coach_message_suggestion && (
        <Button variant="outline" className="w-full gap-2 text-xs">
          <Send className="w-3.5 h-3.5" /> {t("send_summary_to_athlete")}
        </Button>
      )}
    </div>
  );
};

export default AIAdaptationView;
