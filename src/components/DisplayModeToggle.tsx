import { useState, useEffect } from "react";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { useTranslation } from "react-i18next";
import { Zap, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const FIRST_TIME_KEY = "display_mode_tooltip_seen";

const DisplayModeToggle = () => {
  const { mode, toggle } = useDisplayMode();
  const { t } = useTranslation("common");
  const isPro = mode === "advanced";

  const [showOverlay, setShowOverlay] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // First-time tooltip
  useEffect(() => {
    const seen = localStorage.getItem(FIRST_TIME_KEY);
    if (!seen) {
      const timer = setTimeout(() => setShowTooltip(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem(FIRST_TIME_KEY, "1");
  };

  const handleToggle = () => {
    dismissTooltip();
    toggle();
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 2800);
  };

  return (
    <div className="relative">
      {/* Segmented pill control */}
      <div className="relative flex items-center bg-secondary rounded-full p-0.5 border border-border">
        {/* Sliding highlight */}
        <motion.div
          className="absolute top-0.5 bottom-0.5 rounded-full bg-background shadow-sm border border-border/50"
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{ width: "50%" }}
          animate={{ x: isPro ? "100%" : "0%" }}
        />

        <button
          onClick={!isPro ? undefined : handleToggle}
          className={cn(
            "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors min-w-[80px] justify-center",
            !isPro ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Target className="w-3.5 h-3.5" strokeWidth={2} />
          <span>{t("mode_essential", "Essential")}</span>
        </button>

        <button
          onClick={isPro ? undefined : handleToggle}
          className={cn(
            "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors min-w-[80px] justify-center",
            isPro ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Zap className="w-3.5 h-3.5" strokeWidth={2} />
          <span>{t("mode_pro")}</span>
        </button>
      </div>

      {/* First-time tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[85vw] max-w-[260px]"
          >
            <div className="bg-popover border border-border rounded-xl shadow-lg p-3 text-xs text-popover-foreground relative">
              <p className="font-medium mb-1">✨ {t("mode_tooltip_title", "Display mode")}</p>
              <p className="text-muted-foreground leading-relaxed">
                {t("mode_tooltip_desc", "Switch between Essential (clean & simple) and Pro (detailed analytics) anytime.")}
              </p>
              <button
                onClick={dismissTooltip}
                className="mt-2 text-primary font-semibold text-[11px] hover:underline"
              >
                {t("onboarding_got_it")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode change overlay toast */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm"
          >
            <div className={cn(
              "rounded-xl border shadow-lg p-4 backdrop-blur-sm",
              isPro
                ? "bg-primary/5 border-primary/20"
                : "bg-card border-border"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {isPro ? (
                  <Zap className="w-4 h-4 text-primary" strokeWidth={2} />
                ) : (
                  <Target className="w-4 h-4 text-foreground" strokeWidth={2} />
                )}
                <span className="text-sm font-bold">
                  {isPro
                    ? t("mode_pro_enabled", "Pro mode enabled")
                    : t("mode_essential_enabled", "Essential mode")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isPro
                  ? t("mode_pro_desc", "You now see: RPE tracking, tempo, volume analytics, body stats, detailed nutrition macros")
                  : t("mode_essential_desc", "Streamlined view for focused training")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DisplayModeToggle;
