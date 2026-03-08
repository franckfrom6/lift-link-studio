import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlan, useCurrentPlan } from "@/providers/PlanProvider";
import { Check, X, Star, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const CONTACT_EMAIL = "contact@f6gym.app";

const PLAN_FEATURES: Record<string, { key: string; free: string; essential: string; advanced: string }[]> = {
  coach: [
    { key: "clients", free: "5", essential: "15", advanced: "unlimited" },
    { key: "program_creation", free: "✅", essential: "✅", advanced: "✅" },
    { key: "ai_program_generation", free: "❌", essential: "5/mo", advanced: "50/mo" },
    { key: "session_sections", free: "❌", essential: "✅", advanced: "✅" },
    { key: "nutrition_tracking", free: "❌", essential: "✅", advanced: "✅" },
    { key: "pdf_export", free: "❌", essential: "✅", advanced: "✅" },
    { key: "ai_week_analysis", free: "❌", essential: "❌", advanced: "✅" },
    { key: "ai_cycle_report", free: "❌", essential: "❌", advanced: "✅" },
  ],
};

const PricingPage = () => {
  const { t, i18n } = useTranslation("plans");
  const { allPlans, allPlanFeatures } = usePlan();
  const { plan: currentPlan } = useCurrentPlan();
  const [yearly, setYearly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const lang = i18n.language;

  const sortedPlans = [...allPlans].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const copyEmail = () => {
    navigator.clipboard.writeText(CONTACT_EMAIL);
    toast.success(t("email_copied"));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("pricing_title")}</h1>
          <p className="text-muted-foreground">{t("pricing_subtitle")}</p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>{t("monthly")}</span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>{t("yearly")}</span>
          {yearly && (
            <Badge variant="outline" className="text-[10px] bg-success-bg text-success border-success/30">
              {t("save_percent")}
            </Badge>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {sortedPlans.map((plan: any) => {
            const isCurrent = currentPlan?.name === plan.name;
            const isPopular = plan.name === "advanced";
            const monthlyPrice = yearly
              ? plan.priceYearly ? Math.round(plan.priceYearly / 12) : 0
              : plan.priceMonthly || 0;

            return (
              <div
                key={plan.id}
                className={`glass p-6 space-y-5 relative ${isPopular ? "ring-2 ring-primary" : ""} ${isCurrent ? "border-primary" : ""}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" /> {t("popular")}
                  </Badge>
                )}

                <div className="space-y-1">
                  <h3 className="text-lg font-bold">
                    {lang === "fr" ? plan.displayNameFr : plan.displayNameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === "fr" ? plan.descriptionFr : plan.descriptionEn}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{monthlyPrice}€</span>
                  <span className="text-sm text-muted-foreground">{t("per_month")}</span>
                </div>
                {yearly && plan.priceYearly && (
                  <p className="text-[11px] text-muted-foreground -mt-3">{plan.priceYearly}€{t("per_year")} · {t("billed_yearly")}</p>
                )}

                {/* Feature list */}
                <div className="space-y-2">
                  {PLAN_FEATURES.coach.map((feat) => {
                    const value = feat[plan.name as keyof typeof feat] || "❌";
                    const enabled = value !== "❌";
                    return (
                      <div key={feat.key} className="flex items-center gap-2 text-xs">
                        {enabled ? (
                          <Check className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={2} />
                        ) : (
                          <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" strokeWidth={2} />
                        )}
                        <span className={enabled ? "" : "text-muted-foreground/60"}>
                          {t(`feature_desc_${feat.key}`, feat.key)}
                          {value !== "✅" && value !== "❌" && (
                            <span className="text-muted-foreground ml-1">({value})</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {isCurrent ? (
                  <Button disabled variant="outline" className="w-full">
                    {t("current_plan")}
                  </Button>
                ) : plan.name === "free" ? (
                  <Button disabled variant="ghost" className="w-full text-muted-foreground">
                    {t("plan_free")}
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${isPopular ? "" : "variant-outline"}`}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => setDialogOpen(true)}
                  >
                    {currentPlan?.name === "free" ? t("try_free") : t("choose_plan")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground max-w-md mx-auto">
          {t("all_plans_include")}
        </p>
      </div>

      {/* Coming soon dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("coming_soon_title")}</DialogTitle>
            <DialogDescription>{t("coming_soon_desc")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">{CONTACT_EMAIL}</code>
            <Button size="sm" variant="outline" onClick={copyEmail}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingPage;
