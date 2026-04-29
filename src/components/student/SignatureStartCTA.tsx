import { ArrowRight, CheckCircle2, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface SignatureStartCTAProps {
  sessionId: string;
  sessionName: string;
  exerciseCount: number;
  muscleGroups?: string[];
  weekIndex: number;
  totalWeeks: number;
  isCompleted: boolean;
  /** Optional secondary action — opens session detail without starting. */
  onShowDetail?: () => void;
}

/**
 * Floating bottom CTA inspired by the "Signature" mock.
 * Sits in the thumb-zone, replaces the mobile bottom nav on the dashboard.
 * Uses --primary (Bleu Klein in light / Orange in dark) per branding rules.
 */
const SignatureStartCTA = ({
  sessionId,
  sessionName,
  exerciseCount,
  muscleGroups = [],
  weekIndex,
  totalWeeks,
  isCompleted,
  onShowDetail,
}: SignatureStartCTAProps) => {
  const { t } = useTranslation(["session", "calendar", "common"]);
  const navigate = useNavigate();

  const handleStart = () => navigate(`/student/session/${sessionId}`);

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 28 }}
      className="fixed left-0 right-0 bottom-0 z-30 px-4 pt-6 pointer-events-none md:hidden"
      style={{
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        background:
          "linear-gradient(to top, hsl(var(--background)) 60%, hsl(var(--background) / 0.85) 80%, transparent)",
      }}
    >
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div
          className={
            isCompleted
              ? "rounded-2xl bg-card border border-border shadow-lg overflow-hidden"
              : "rounded-2xl bg-primary text-primary-foreground shadow-lg overflow-hidden"
          }
        >
          <div className="px-4 pt-3 pb-2">
            <p
              className={
                isCompleted
                  ? "text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                  : "text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/75"
              }
            >
              {isCompleted ? t("session:session_completed", "Séance terminée") : t("calendar:today_focus", "Aujourd'hui")}
            </p>
            <p className="text-base font-bold tracking-tight truncate mt-0.5">{sessionName}</p>
            <p
              className={
                isCompleted
                  ? "tabular text-[11px] mt-0.5 text-muted-foreground"
                  : "tabular text-[11px] mt-0.5 text-primary-foreground/75"
              }
            >
              {exerciseCount} ex.
              {muscleGroups.length > 0 && ` · ${muscleGroups.slice(0, 3).join(", ")}`}
              {totalWeeks > 0 && ` · S${weekIndex + 1}/${totalWeeks}`}
            </p>
          </div>

          <div
            className={
              isCompleted
                ? "flex border-t border-border"
                : "flex border-t border-primary-foreground/15"
            }
          >
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 font-bold text-sm min-h-[44px] active:opacity-80 transition-opacity"
              aria-label={isCompleted ? t("session:view_recap", "Voir le récap") : t("session:start_session", "Démarrer la séance")}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                  {t("session:view_recap", "Voir le récap")}
                </>
              ) : (
                <>
                  {t("session:start_session", "Démarrer la séance")}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>

            {onShowDetail && (
              <button
                type="button"
                onClick={onShowDetail}
                className={
                  isCompleted
                    ? "px-4 py-3.5 border-l border-border min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground active:bg-muted transition-colors"
                    : "px-4 py-3.5 border-l border-primary-foreground/15 min-h-[44px] min-w-[44px] flex items-center justify-center text-primary-foreground/85 active:bg-primary-foreground/10 transition-colors"
                }
                aria-label={t("session:view_detail", "Voir le détail")}
              >
                <List className="w-4 h-4" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignatureStartCTA;