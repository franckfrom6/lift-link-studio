import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

const CHECKLIST_ITEMS = [
  { key: "program_seen", labelKey: "onboarding_step_program" },
  { key: "session_started", labelKey: "onboarding_step_session" },
  { key: "nutrition_seen", labelKey: "onboarding_step_nutrition" },
  { key: "checkin_seen", labelKey: "onboarding_step_checkin" },
  { key: "session_builder_seen", labelKey: "onboarding_step_builder" },
];

const FirstStepsChecklist = () => {
  const { t } = useTranslation("common");
  const { steps, completedCount } = useOnboarding();

  const done = CHECKLIST_ITEMS.filter((i) => steps[i.key]).length;
  if (done >= CHECKLIST_ITEMS.length) return null;

  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="text-sm font-semibold">{t("onboarding_first_steps")}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {done}/{CHECKLIST_ITEMS.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = !!steps[item.key];
          return (
            <div key={item.key} className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              )}
              <span
                className={`text-sm ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {t(item.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FirstStepsChecklist;
