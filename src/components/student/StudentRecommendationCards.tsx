import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ExternalLink } from "lucide-react";
import RecommendationCategoryBadge from "@/components/coach/RecommendationCategoryBadge";

interface CoachReco {
  id: string;
  title: string;
  content: string;
  category: string;
  trigger_type: string | null;
  trigger_config: any;
  priority: number;
  video_url?: string | null;
  duration_minutes?: number | null;
}

interface Props {
  type?: "nutrition" | "recovery" | "all";
  triggerContext?: {
    muscleGroups?: string[];
    dayOfWeek?: number;
    isDeload?: boolean;
    sorenessLevel?: number;
    macroAdherence?: Record<string, number>;
  };
}

const StudentRecommendationCards = ({ type = "all", triggerContext }: Props) => {
  const { t } = useTranslation("recommendations");
  const { user } = useAuth();
  const [nutritionRecos, setNutritionRecos] = useState<CoachReco[]>([]);
  const [recoveryRecos, setRecoveryRecos] = useState<CoachReco[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchRecos = async () => {
      if (type === "nutrition" || type === "all") {
        const { data } = await supabase
          .from("coach_nutrition_recommendations")
          .select("*")
          .order("priority", { ascending: true });
        setNutritionRecos(data || []);
      }
      if (type === "recovery" || type === "all") {
        const { data } = await supabase
          .from("coach_recovery_recommendations")
          .select("*")
          .order("priority", { ascending: true });
        setRecoveryRecos(data || []);
      }
    };
    fetchRecos();
  }, [user, type]);

  const matchesTrigger = (reco: CoachReco): boolean => {
    if (!reco.trigger_type || reco.trigger_type === "always") return true;
    if (!triggerContext) return reco.trigger_type === "always";

    switch (reco.trigger_type) {
      case "post_session": {
        const recoGroups = reco.trigger_config?.muscle_groups || [];
        const sessionGroups = triggerContext.muscleGroups || [];
        return recoGroups.length === 0 || recoGroups.some((g: string) => sessionGroups.includes(g));
      }
      case "specific_day":
        return triggerContext.dayOfWeek === reco.trigger_config?.day_of_week;
      case "when_deficit": {
        const macro = reco.trigger_config?.macro;
        const threshold = reco.trigger_config?.threshold_pct || 80;
        const adherence = triggerContext.macroAdherence?.[macro];
        return adherence !== undefined && adherence < threshold;
      }
      case "high_soreness": {
        const minSoreness = reco.trigger_config?.soreness_level_min || 3;
        return (triggerContext.sorenessLevel || 0) >= minSoreness;
      }
      case "deload_week":
        return triggerContext.isDeload === true;
      default:
        return true;
    }
  };

  const filteredNutrition = nutritionRecos.filter(matchesTrigger);
  const filteredRecovery = recoveryRecos.filter(matchesTrigger);
  const allFiltered = [...filteredNutrition, ...filteredRecovery].sort((a, b) => a.priority - b.priority);

  if (allFiltered.length === 0) return null;

  return (
    <div className="space-y-2">
      {allFiltered.map((reco) => (
        <RecoCard key={reco.id} reco={reco} />
      ))}
    </div>
  );
};

const RecoCard = ({ reco }: { reco: CoachReco }) => {
  const { t } = useTranslation("recommendations");
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-primary/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="outline" className="shrink-0 text-[10px] bg-primary/10 text-primary border-primary/20">
                  {t("from_coach")}
                </Badge>
                <CardTitle className="text-sm truncate">{reco.title}</CardTitle>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <RecommendationCategoryBadge category={reco.category} />
                {reco.duration_minutes && (
                  <span className="text-[10px] text-muted-foreground">⏱ {reco.duration_minutes}min</span>
                )}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{reco.content}</p>
            {reco.video_url && (
              <a
                href={reco.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Vidéo
              </a>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default StudentRecommendationCards;
