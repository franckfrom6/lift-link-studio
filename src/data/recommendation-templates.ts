export const NUTRITION_CATEGORIES = [
  "general", "pre_workout", "post_workout", "breakfast", "lunch", "dinner", "snack", "hydration", "supplements",
] as const;

export const RECOVERY_CATEGORIES = [
  "stretching", "foam_rolling", "mobility", "sleep", "active_recovery", "cold_therapy", "massage", "rest_day_protocol",
] as const;

export const TRIGGER_TYPES = [
  "always", "post_session", "specific_day", "when_deficit", "high_soreness", "deload_week",
] as const;

export const NUTRITION_TRIGGER_TYPES = ["always", "post_session", "specific_day", "when_deficit"] as const;
export const RECOVERY_TRIGGER_TYPES = ["always", "post_session", "specific_day", "high_soreness", "deload_week"] as const;

export const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "arms", "abs", "glutes", "quads", "hamstrings", "calves", "core",
] as const;

export interface NutritionRecommendation {
  id: string;
  coach_id: string;
  student_id: string | null;
  title: string;
  content: string;
  category: string;
  trigger_type: string | null;
  trigger_config: any;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  student_name?: string;
}

export interface RecoveryRecommendation {
  id: string;
  coach_id: string;
  student_id: string | null;
  title: string;
  content: string;
  category: string;
  trigger_type: string | null;
  trigger_config: any;
  video_url: string | null;
  duration_minutes: number | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  student_name?: string;
}

export interface RecommendationTemplate {
  title_fr: string;
  title_en: string;
  content_fr: string;
  content_en: string;
  category: string;
  trigger_type: string;
  trigger_config?: any;
  duration_minutes?: number;
}

export const NUTRITION_TEMPLATES: RecommendationTemplate[] = [
  {
    title_fr: "Petit-déjeuner protéiné type",
    title_en: "High-protein breakfast",
    content_fr: "Vise 30g de protéines au petit-déj : œufs (2-3), fromage blanc 0% (200g), ou flocons d'avoine protéinés avec whey. Ajoute une source de glucides complexes (pain complet, flocons d'avoine) et un fruit pour l'énergie.",
    content_en: "Aim for 30g protein at breakfast: eggs (2-3), Greek yogurt (200g), or protein oatmeal with whey. Add a complex carb source (whole grain bread, oats) and a fruit for energy.",
    category: "breakfast",
    trigger_type: "always",
  },
  {
    title_fr: "Repas post lower body",
    title_en: "Post lower body meal",
    content_fr: "Dans les 2h après ta séance jambes : 35-40g protéines + 60-80g glucides. Ex : poulet/dinde + riz basmati + légumes verts. Si tu n'as pas faim, un shaker protéiné + banane en attendant le repas.",
    content_en: "Within 2h of your leg session: 35-40g protein + 60-80g carbs. E.g.: chicken/turkey + basmati rice + green veggies. If not hungry, a protein shake + banana while waiting for the meal.",
    category: "post_workout",
    trigger_type: "post_session",
    trigger_config: { muscle_groups: ["quads", "hamstrings", "glutes"] },
  },
  {
    title_fr: "Repas post upper body",
    title_en: "Post upper body meal",
    content_fr: "Dans les 2h : 30-35g protéines + 40-60g glucides. Ex : saumon/thon + patate douce + salade. Pense aux bonnes graisses pour l'inflammation musculaire.",
    content_en: "Within 2h: 30-35g protein + 40-60g carbs. E.g.: salmon/tuna + sweet potato + salad. Include healthy fats for muscle inflammation.",
    category: "post_workout",
    trigger_type: "post_session",
    trigger_config: { muscle_groups: ["chest", "back", "shoulders", "arms"] },
  },
  {
    title_fr: "Hydratation jour d'entraînement",
    title_en: "Training day hydration",
    content_fr: "Bois 500ml dans l'heure avant ta séance + 500ml pendant + 500ml après. Total journée : minimum 2L. Si séance intense, ajoute des électrolytes (pincée de sel + citron dans l'eau).",
    content_en: "Drink 500ml in the hour before your session + 500ml during + 500ml after. Daily total: minimum 2L. For intense sessions, add electrolytes (pinch of salt + lemon in water).",
    category: "hydration",
    trigger_type: "always",
  },
  {
    title_fr: "Collation pré-training",
    title_en: "Pre-workout snack",
    content_fr: "1h30 avant : glucides facilement digestibles + protéines légères. Ex : banane + beurre de cacahuète, ou galette de riz + shaker. Évite les fibres et graisses lourdes juste avant.",
    content_en: "1.5h before: easily digestible carbs + light protein. E.g.: banana + peanut butter, or rice cake + shake. Avoid heavy fiber and fats right before.",
    category: "pre_workout",
    trigger_type: "always",
  },
];

export const RECOVERY_TEMPLATES: RecommendationTemplate[] = [
  {
    title_fr: "Foam rolling post jambes",
    title_en: "Post-leg foam rolling",
    content_fr: "5 passes lentes (5-10 sec par zone) sur chaque groupe : quadriceps, IT band, fessiers, mollets, adducteurs. Insiste sur les points sensibles. Respire profondément.",
    content_en: "5 slow passes (5-10 sec per area) on each group: quads, IT band, glutes, calves, adductors. Focus on tender spots. Breathe deeply.",
    category: "foam_rolling",
    trigger_type: "post_session",
    trigger_config: { muscle_groups: ["quads", "hamstrings", "glutes", "calves"] },
    duration_minutes: 10,
  },
  {
    title_fr: "Routine mobilité hanches",
    title_en: "Hip mobility routine",
    content_fr: "90/90 hip switch (10 reps), pigeon stretch (30s/côté), hip circles (10/côté), frog stretch (30s). Idéal après chaque séance lower body ou en routine quotidienne.",
    content_en: "90/90 hip switch (10 reps), pigeon stretch (30s/side), hip circles (10/side), frog stretch (30s). Ideal after every lower body session or as a daily routine.",
    category: "mobility",
    trigger_type: "post_session",
    trigger_config: { muscle_groups: ["glutes", "quads", "hamstrings"] },
    duration_minutes: 8,
  },
  {
    title_fr: "Protocole sommeil",
    title_en: "Sleep protocol",
    content_fr: "Vise 7-8h de sommeil. Pas d'écran 30 min avant. Chambre fraîche (18-20°C). Si tu as du mal à dormir : magnésium (300mg) 30 min avant le coucher. Routine : lecture ou respiration guidée.",
    content_en: "Aim for 7-8h sleep. No screens 30 min before. Cool room (18-20°C). If struggling: magnesium (300mg) 30 min before bed. Routine: reading or guided breathing.",
    category: "sleep",
    trigger_type: "always",
  },
  {
    title_fr: "Protocole jour de repos actif",
    title_en: "Active rest day protocol",
    content_fr: "Marche 20 min + étirements légers full body (10 min). Pas d'entraînement intense. Focus récupération : hydratation, alimentation, sommeil.",
    content_en: "20 min walk + light full body stretching (10 min). No intense training. Focus recovery: hydration, nutrition, sleep.",
    category: "active_recovery",
    trigger_type: "specific_day",
    trigger_config: { day_of_week: 7 },
    duration_minutes: 30,
  },
  {
    title_fr: "Récup semaine deload",
    title_en: "Deload week recovery",
    content_fr: "Réduis les charges de 40-50%. Focus technique et mind-muscle connection. Ajoute 10 min de mobilité après chaque séance. Profite de cette semaine pour dormir plus et bien manger.",
    content_en: "Reduce loads by 40-50%. Focus on technique and mind-muscle connection. Add 10 min mobility after each session. Use this week to sleep more and eat well.",
    category: "active_recovery",
    trigger_type: "deload_week",
  },
];
