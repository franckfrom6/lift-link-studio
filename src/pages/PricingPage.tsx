import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlan, useCurrentPlan } from "@/providers/PlanProvider";
import { Check, X, Star, Copy, Zap } from "lucide-react";
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

const CONTACT_EMAIL = "contact@6way.app";

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

const planColor = (name: string) => {
  switch (name) {
    case "free":
      return "border-border/60";
    case "essential":
      return "border-primary/40";
    case "advanced":
      return "border-primary ring-1 ring-primary/30";
    default:
      return "border-border";
  }
};

const PricingPage = () => {
  const { t, i18n } = useTranslation("plans");
  const { allPlans } = usePlan();
  const { plan: currentPlan } = useCurrentPlan();
  const [yearly, setYearly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const lang = i18n.language;

  const sortedPlans = [...allPlans].sort((a: any, b: any) => (a.sortOrder || 2) - (b.sortOrder || 2));

  const copyEmail = () => {
    navigator.clipboard.writeText(CONTACT_EMAIL);
    toast.success(t("email_copied"));
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-primary" strokeWidth={2.5} />
            <span className="text-xs font-micro uppercase tracking-[0.2em] text-primary">
              6way
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight">
            {t("pricing_title")}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-base">
            {t("pricing_subtitle")}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
            {t("monthly")}
          </span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            {t("yearly")}
          </span>
          {yearly && (
            <Badge variant="outline" className="text-[10px] bg-success-bg text-success border-success/30">
              {t("save_percent")}
            </Badge>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-5">
          {sortedPlans.map((plan: any) => {
            const isCurrent = currentPlan?.name === plan.name;
            const isPopular = plan.name === "advanced";
            const monthlyPrice = yearly
              ? plan.priceYearly ? Math.round(plan.priceYearly / 12) : 0
              : plan.priceMonthly || 0;
            const yearlyPrice = plan.priceYearly || 2;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border bg-card p-6 space-y-5 ${planColor(plan.name)} ${isCurrent ? "ring-1 ring-primary/40" : ""}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary">
                    <Star className="w-3 h-3 mr-1" fill="currentColor" /> {t("popular")}
                  </Badge>
                )}

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold">
                    {lang === "fr" ? plan.displayNameFr : plan.displayNameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === "fr" ? plan.descriptionFr : plan.descriptionEn}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tabular-nums font-data">
                      {monthlyPrice >  0  ? `${monthlyPrice}€` : "0€"}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      {t("per_month")}
                    </span>
                  </div>
                  {yearly && plan.priceYearly && (
                    <p className="text-[11px] text-muted-foreground">
                      {yearlyPrice}€{t("per_year")} · {t("billed_yearly")}
                    </p>
                  )}
                  {!yearly && plan.name === "free" && (
                    <p className="text-[11px] text-muted-foreground">{t("plan_free")}</p>
                  )}
                </div>

                {/* Feature list */}
                <div className="space-y-2.5">
                  {PLAN_FEATURES.coach.map((feat) => {
                    const value = feat[plan.name as keyof typeof feat] || "❌";
                    const enabled = value !== "❌";
                    return (
                      <div key={feat.key} className="flex items-start gap-2.5 text-xs">
                        {enabled ? (
                          <Check className="w-4 h-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-0.5" strokeWidth={2.5} />
                        )}
                        <span className={enabled ? "text-foreground" : "text-muted-foreground/50"}>
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
                  <Button disabled variant="outline" className="w-full h-11">
                    {t("current_plan")}
                  </Button>
                ) : plan.name === "free" ? (
                  <Button disabled variant="ghost" className="w-full h-11 text-muted-foreground">
                    {t("plan_free")}
                  </Button>
                ) : (
                  <Button
                    className="w-full h-11"
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

        <p className="text-center text-xs text-muted-foreground max-w-lg mx-auto mt-8 leading-relaxed">
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
            <code className="flex-1 bg-muted px-3 py-2.5 rounded-lg text-sm font-data">{CONTACT_EMAIL}</code>
            <Button size="sm" variant="outline" onClick={copyEmail} className="shrink-0">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingPage;
