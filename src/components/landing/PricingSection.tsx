import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Check, X } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const ACCENT = "#6C5CE7";

interface Plan {
  id: string;
  name: string;
  display_name_fr: string;
  display_name_en: string;
  price_monthly: number | null;
  price_yearly: number | null;
  sort_order: number;
}

const featuresByPlan: Record<string, { key: string; included: boolean }[]> = {
  free: [
    { key: "5 athlètes", included: true },
    { key: "Programmes", included: true },
    { key: "Séances", included: true },
    { key: "Calendrier", included: true },
    { key: "IA", included: false },
  ],
  essential: [
    { key: "15 athlètes", included: true },
    { key: "Tout Free", included: true },
    { key: "+ IA (5/mois)", included: true },
    { key: "+ Nutrition", included: true },
    { key: "+ PDF", included: true },
    { key: "+ Photos", included: true },
  ],
  advanced: [
    { key: "Illimité", included: true },
    { key: "Tout Essentiel", included: true },
    { key: "+ Toute l'IA", included: true },
    { key: "+ Bilans IA", included: true },
    { key: "+ Insights IA", included: true },
    { key: "+ Analyse IA", included: true },
  ],
};

const featuresByPlanEn: Record<string, { key: string; included: boolean }[]> = {
  free: [
    { key: "5 athletes", included: true },
    { key: "Programs", included: true },
    { key: "Sessions", included: true },
    { key: "Calendar", included: true },
    { key: "AI", included: false },
  ],
  essential: [
    { key: "15 athletes", included: true },
    { key: "All Free", included: true },
    { key: "+ AI (5/mo)", included: true },
    { key: "+ Nutrition", included: true },
    { key: "+ PDF", included: true },
    { key: "+ Photos", included: true },
  ],
  advanced: [
    { key: "Unlimited", included: true },
    { key: "All Essential", included: true },
    { key: "+ All AI", included: true },
    { key: "+ AI Reviews", included: true },
    { key: "+ AI Insights", included: true },
    { key: "+ AI Analysis", included: true },
  ],
};

const PricingSection = () => {
  const { t, i18n } = useTranslation("landing");
  const { t: tp } = useTranslation("plans");
  const [yearly, setYearly] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const ref = useScrollReveal();

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => { if (data) setPlans(data as Plan[]); });
  }, []);

  const isFr = i18n.language === "fr";
  const featMap = isFr ? featuresByPlan : featuresByPlanEn;

  return (
    <section id="tarifs" className="py-20">
      <div ref={ref} className="max-w-[1200px] mx-auto px-4 sm:px-6 scroll-reveal">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
          {t("pricing_title")}
        </h2>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!yearly ? "font-semibold text-gray-900" : "text-gray-500"}`}>{tp("monthly")}</span>
          <button
            onClick={() => setYearly(!yearly)}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ background: yearly ? ACCENT : "#D1D5DB" }}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${yearly ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
          <span className={`text-sm ${yearly ? "font-semibold text-gray-900" : "text-gray-500"}`}>
            {tp("yearly")}
            <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: ACCENT }}>
              {tp("save_percent")}
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const isPopular = plan.name === "advanced";
            const price = yearly ? plan.price_yearly : plan.price_monthly;
            const displayName = isFr ? plan.display_name_fr : plan.display_name_en;
            const features = featMap[plan.name] || [];

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-4 sm:p-6 ${
                  isPopular
                    ? "border-2 shadow-lg"
                    : "border border-gray-200"
                } bg-white`}
                style={isPopular ? { borderColor: ACCENT } : {}}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ background: ACCENT }}>
                    {tp("popular")}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{displayName}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {price ? `${price}€` : "0€"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {yearly ? tp("per_year") : tp("per_month")}
                  </span>
                </div>
                <ul className="space-y-2 sm:space-y-2.5 mb-8">
                  {features.map((f) => (
                    <li key={f.key} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check size={16} style={{ color: ACCENT }} className="flex-shrink-0" />
                      ) : (
                        <X size={16} className="text-gray-300 flex-shrink-0" />
                      )}
                      <span className={f.included ? "text-gray-700" : "text-gray-400"}>{f.key}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth?tab=signup"
                  className={`block text-center text-sm font-semibold rounded-xl py-2.5 transition-all ${
                    isPopular
                      ? "text-white hover:opacity-90"
                      : "text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                  style={isPopular ? { background: ACCENT } : {}}
                >
                  {tp("choose_plan")}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          {t("pricing_all_include")}
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
