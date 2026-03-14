import { Play, CheckCircle, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface TodayFocusCardProps {
  sessionName: string;
  sessionId: string;
  exerciseCount: number;
  muscleGroups: string[];
  isCompleted: boolean;
}

const TodayFocusCard = ({ sessionName, sessionId, exerciseCount, muscleGroups, isCompleted }: TodayFocusCardProps) => {
  const { t } = useTranslation(["session", "calendar"]);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass p-5 space-y-3 relative overflow-hidden"
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-t-xl" />

      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isCompleted ? "✓ " : ""}{t("calendar:today_focus", "Aujourd'hui")}
          </p>
          <h3 className="font-bold text-lg leading-snug truncate">{sessionName}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Dumbbell className="w-3 h-3" strokeWidth={1.5} />
            <span>{exerciseCount} ex.</span>
            {muscleGroups.length > 0 && (
              <>
                <span>·</span>
                <span className="truncate">{muscleGroups.slice(0, 3).join(", ")}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <Button
          className="w-full h-12 text-sm font-bold gap-2"
          onClick={() => navigate(`/student/session/${sessionId}`)}
        >
          <Play className="w-4 h-4" strokeWidth={2} />
          {t("session:start_session", "Commencer")}
        </Button>
      ) : (
        <div className="flex items-center justify-center gap-2 h-12 rounded-lg bg-success-bg text-success">
          <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-sm font-semibold">{t("session:session_done", "Terminée ✓")}</span>
        </div>
      )}
    </motion.div>
  );
};

export default TodayFocusCard;
