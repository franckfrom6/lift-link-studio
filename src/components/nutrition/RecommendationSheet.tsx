import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import RecoveryRecommendationCard, { RecoveryRecommendation } from "./RecoveryRecommendationCard";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import StudentRecommendationCards from "@/components/student/StudentRecommendationCards";

const STATIC_RECOMMENDATIONS: RecoveryRecommendation[] = [
  { id: "r1", trigger_type: "post_session", activity_type: null, muscle_groups: ["glutes","quads","hamstrings"], recommendation_type: "nutrition", title_fr: "🥤 Nutrition post lower body", title_en: "🥤 Post lower body nutrition", content_fr: "30-40g de protéines + 50-80g de glucides dans les 2h post-training. Exemple : poulet + riz ou shaker + banane.", content_en: "30-40g protein + 50-80g carbs within 2h. Example: chicken + rice or shake + banana.", priority: 1 },
  { id: "r2", trigger_type: "post_session", activity_type: null, muscle_groups: ["glutes","quads","hamstrings"], recommendation_type: "recovery", title_fr: "🧊 Récupération lower body", title_en: "🧊 Lower body recovery", content_fr: "Foam rolling fessiers et ischios, 5 min. Étirements statiques hanche et quadriceps.", content_en: "Foam rolling glutes and hamstrings, 5 min. Static hip and quad stretches.", priority: 1 },
  { id: "r3", trigger_type: "post_session", activity_type: null, muscle_groups: ["glutes","quads","hamstrings"], recommendation_type: "sleep", title_fr: "😴 Sommeil & récupération", title_en: "😴 Sleep & recovery", content_fr: "Vise 7-8h de sommeil. La synthèse protéique est maximale pendant le sommeil profond.", content_en: "Aim for 7-8h of sleep. Protein synthesis peaks during deep sleep.", priority: 2 },
  { id: "r4", trigger_type: "post_session", activity_type: "hiit", muscle_groups: [], recommendation_type: "nutrition", title_fr: "🥤 Post HIIT", title_en: "🥤 Post HIIT", content_fr: "Hydratation +500ml dans l'heure. Repas complet dans les 2h avec protéines et glucides.", content_en: "Hydrate +500ml in 1h. Full meal in 2h with protein and carbs.", priority: 1 },
  { id: "r5", trigger_type: "post_session", activity_type: "hiit", muscle_groups: [], recommendation_type: "recovery", title_fr: "🧊 Récupération HIIT", title_en: "🧊 HIIT recovery", content_fr: "Marche légère 10-15 min pour le retour au calme. Évite un entraînement intense dans les 24h.", content_en: "Light walk 10-15 min to cool down. Avoid intense training for 24h.", priority: 1 },
  { id: "r6", trigger_type: "post_session", activity_type: "cycling", muscle_groups: [], recommendation_type: "nutrition", title_fr: "🥤 Post Cycling", title_en: "🥤 Post Cycling", content_fr: "Recharge glucidique prioritaire. Banane + shaker protéiné en collation rapide.", content_en: "Prioritize carb reload. Banana + protein shake as a quick snack.", priority: 1 },
  { id: "r7", trigger_type: "post_session", activity_type: "cycling", muscle_groups: [], recommendation_type: "recovery", title_fr: "🦵 Récupération Cycling", title_en: "🦵 Cycling recovery", content_fr: "Étirements quadriceps et fléchisseurs de hanche. Foam rolling IT band.", content_en: "Quad and hip flexor stretches. IT band foam rolling.", priority: 1 },
  { id: "r8", trigger_type: "post_session", activity_type: "pilates", muscle_groups: [], recommendation_type: "nutrition", title_fr: "🥤 Post Pilates", title_en: "🥤 Post Pilates", content_fr: "Repas normal, pas de besoin spécifique post-séance. Hydratation normale.", content_en: "Normal meal, no specific post-session needs. Normal hydration.", priority: 3 },
  { id: "r9", trigger_type: "high_fatigue", activity_type: null, muscle_groups: [], recommendation_type: "recovery", title_fr: "⚠️ Fatigue élevée", title_en: "⚠️ High fatigue", content_fr: "Priorise le sommeil cette semaine. Réduis l'intensité de 20-30%. Alimentation anti-inflammatoire.", content_en: "Prioritize sleep this week. Reduce intensity 20-30%. Anti-inflammatory diet.", priority: 1 },
  { id: "r10", trigger_type: "high_fatigue", activity_type: null, muscle_groups: [], recommendation_type: "nutrition", title_fr: "🍎 Nutrition anti-fatigue", title_en: "🍎 Anti-fatigue nutrition", content_fr: "Augmente tes apports en oméga-3 (poisson gras, noix). Privilégie les aliments riches en magnésium et fer.", content_en: "Increase omega-3 intake (fatty fish, nuts). Favor foods rich in magnesium and iron.", priority: 1 },
  { id: "r11", trigger_type: "high_fatigue", activity_type: null, muscle_groups: [], recommendation_type: "sleep", title_fr: "😴 Sommeil prioritaire", title_en: "😴 Sleep priority", content_fr: "Objectif 8-9h de sommeil. Évite les écrans 1h avant le coucher. Température de la chambre : 18-19°C.", content_en: "Aim for 8-9h of sleep. No screens 1h before bed. Room temperature: 64-66°F.", priority: 1 },
];

export function getRecommendations(opts: {
  triggerType: "post_session" | "high_fatigue" | "deload_week";
  activityType?: string | null;
  muscleGroups?: string[];
}): RecoveryRecommendation[] {
  return STATIC_RECOMMENDATIONS.filter(r => {
    if (r.trigger_type !== opts.triggerType) return false;
    if (opts.triggerType === "post_session") {
      if (r.activity_type && opts.activityType && r.activity_type === opts.activityType) return true;
      if (!r.activity_type && r.muscle_groups.length > 0 && opts.muscleGroups) {
        return r.muscle_groups.some(g => opts.muscleGroups!.includes(g));
      }
      if (r.activity_type && !opts.activityType && r.muscle_groups.length === 0) return false;
      if (!r.activity_type && r.muscle_groups.length === 0) return false;
    }
    return true;
  }).sort((a, b) => a.priority - b.priority);
}

interface RecommendationSheetProps {
  open: boolean;
  onClose: () => void;
  triggerType: "post_session" | "high_fatigue" | "deload_week";
  activityType?: string | null;
  muscleGroups?: string[];
}

const RecommendationSheet = ({ open, onClose, triggerType, activityType, muscleGroups }: RecommendationSheetProps) => {
  const { t, i18n } = useTranslation(['recovery', 'recommendations']);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const recommendations = getRecommendations({ triggerType, activityType, muscleGroups })
    .filter(r => !dismissed.has(r.id));

  const title = triggerType === "post_session" ? t('recovery:post_session_title')
    : triggerType === "high_fatigue" ? t('recovery:high_fatigue_title')
    : t('recovery:deload_title');

  // Build trigger context for coach recommendations
  const triggerContext = {
    muscleGroups: muscleGroups || [],
    dayOfWeek: new Date().getDay() || 7, // 1-7 Mon-Sun
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-base">{title}</SheetTitle>
          <p className="text-xs text-muted-foreground">{t('recovery:subtitle')}</p>
        </SheetHeader>

        <div className="space-y-3 mt-4 pb-4">
          {/* 1. Coach recommendations (highest priority) */}
          <StudentRecommendationCards
            type="all"
            triggerContext={triggerContext}
          />

          {/* 2. Static recommendations */}
          {recommendations.length > 0 ? (
            recommendations.map(r => (
              <RecoveryRecommendationCard
                key={r.id}
                recommendation={r}
                onDismiss={() => setDismissed(prev => new Set([...prev, r.id]))}
                lang={i18n.language as "fr" | "en"}
              />
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">{t('recovery:all_seen')}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RecommendationSheet;
