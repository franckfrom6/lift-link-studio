import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CHECKLIST_ITEMS = [
  { key: "program_seen", labelKey: "onboarding_step_program" },
  { key: "session_started", labelKey: "onboarding_step_session" },
  { key: "nutrition_seen", labelKey: "onboarding_step_nutrition" },
  { key: "checkin_seen", labelKey: "onboarding_step_checkin" },
  { key: "session_builder_seen", labelKey: "onboarding_step_builder" },
];

const DISMISS_KEY = "checklist_dismissed";

const FirstStepsChecklist = () => {
  const { t } = useTranslation("common");
  const { steps, markStepSeen } = useOnboarding();

  const done = CHECKLIST_ITEMS.filter((i) => steps[i.key]).length;
  const total = CHECKLIST_ITEMS.length;
  const pct = total > 0 ? done / total : 0;
  const RADIUS = 9;
  const CIRC = 2 * Math.PI * RADIUS;
  if (steps[DISMISS_KEY] || done >= CHECKLIST_ITEMS.length) return null;

  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="text-sm font-semibold">{t("onboarding_first_steps")}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{done}/{total}</span>
          <div className="relative w-6 h-6">
            <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r={RADIUS} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
              <motion.circle
                cx="12" cy="12" r={RADIUS}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={false}
                animate={{ strokeDashoffset: CIRC * (1 - pct) }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = !!steps[item.key];
          return (
            <div key={item.key} className="flex items-center gap-2">
              <AnimatePresence mode="wait" initial={false}>
                {isDone ? (
                  <motion.span
                    key="done"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="pending"
                    initial={false}
                    className="shrink-0"
                  >
                    <Circle className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  </motion.span>
                )}
              </AnimatePresence>
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
