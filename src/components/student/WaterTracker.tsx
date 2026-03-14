import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Droplets, Plus } from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const calculateWaterGoal = (weightKg: number): number => {
  const raw = Math.round(weightKg * 35);
  return Math.min(4000, Math.max(1500, Math.round(raw / 100) * 100));
};

interface WaterTrackerProps {
  date?: Date;
}

const WaterTracker = ({ date }: WaterTrackerProps) => {
  const { t } = useTranslation(["nutrition", "common"]);
  const { user, profile } = useAuth();
  const isAdvanced = useIsAdvanced();
  const today = date || new Date();
  const dateStr = format(today, "yyyy-MM-dd");

  const [waterMl, setWaterMl] = useState(0);
  const [goalMl, setGoalMl] = useState(2500);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [history, setHistory] = useState<{ date: string; total: number }[]>([]);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const profileGoal = (profile as any).water_goal_ml;
    if (profileGoal) {
      setGoalMl(profileGoal);
    } else if ((profile as any).weight) {
      setGoalMl(calculateWaterGoal(Number((profile as any).weight)));
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetchWater = async () => {
      const { data } = await supabase
        .from("daily_nutrition_logs")
        .select("water_ml")
        .eq("student_id", user.id)
        .eq("date", dateStr);
      if (data) {
        const total = data.reduce((sum, r) => sum + ((r as any).water_ml || 0), 0);
        setWaterMl(total);
      }
    };
    fetchWater();
  }, [user, dateStr]);

  useEffect(() => {
    if (!user || !isAdvanced) return;
    const fetchHistory = async () => {
      const dates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd"));
      const { data } = await supabase
        .from("daily_nutrition_logs")
        .select("date, water_ml")
        .eq("student_id", user.id)
        .in("date", dates);
      if (data) {
        const byDate: Record<string, number> = {};
        dates.forEach(d => (byDate[d] = 0));
        data.forEach(r => {
          byDate[r.date] = (byDate[r.date] || 0) + ((r as any).water_ml || 0);
        });
        setHistory(dates.map(d => ({ date: d, total: byDate[d] })));
      }
    };
    fetchHistory();
  }, [user, isAdvanced, dateStr]);

  const addWater = async (ml: number) => {
    if (!user || ml <= 0) return;
    const { error } = await supabase
      .from("daily_nutrition_logs")
      .insert({
        student_id: user.id,
        date: dateStr,
        meal_type: "water",
        description: "",
        water_ml: ml,
      } as any);

    if (error) {
      console.error("Water log error:", error);
      toast.error(t("common:error"));
    } else {
      setWaterMl(prev => prev + ml);
      setCustomOpen(false);
      setCustomValue("");
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 500);
    }
  };

  const pct = goalMl > 0 ? Math.min(100, (waterMl / goalMl) * 100) : 0;
  const isComplete = pct >= 100;

  return (
    <div className="glass p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={justAdded ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Droplets className="w-4 h-4 text-info" strokeWidth={1.5} />
          </motion.div>
          <span className="text-sm font-semibold">{t("nutrition:water_title")}</span>
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {waterMl} / {goalMl} ml
          {isAdvanced && <span className="ml-1">({Math.round(pct)}%)</span>}
        </span>
      </div>

      {/* Progress bar with spring animation */}
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{
            background: isComplete
              ? "hsl(var(--success))"
              : "hsl(var(--info))",
          }}
        />
      </div>

      {/* Quick-add buttons with press scale */}
      <div className="flex gap-2">
        <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-9"
            onClick={() => addWater(250)}
          >
            <Plus className="w-3 h-3 mr-1" strokeWidth={2} />
            250ml
          </Button>
        </motion.div>
        <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-9"
            onClick={() => addWater(500)}
          >
            <Plus className="w-3 h-3 mr-1" strokeWidth={2} />
            500ml
          </Button>
        </motion.div>
        {customOpen ? (
          <div className="flex gap-1 flex-1">
            <Input
              type="number"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              placeholder="ml"
              className="h-9 text-xs"
              autoFocus
            />
            <Button
              size="sm"
              className="h-9 text-xs px-2"
              onClick={() => addWater(parseInt(customValue) || 0)}
            >
              OK
            </Button>
          </div>
        ) : (
          <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-9"
              onClick={() => setCustomOpen(true)}
            >
              {t("nutrition:water_other")}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Pro: 7-day mini bar chart with staggered animation */}
      <AnimatePresence>
        {isAdvanced && history.length > 0 && (
          <motion.div
            className="pt-2 border-t border-border"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("nutrition:water_history")}
            </p>
            <div className="flex items-end gap-1 h-12">
              {history.map((day, idx) => {
                const dayPct = goalMl > 0 ? Math.min(100, (day.total / goalMl) * 100) : 0;
                const dayLabel = day.date.slice(-2);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full bg-secondary rounded-sm overflow-hidden" style={{ height: "32px" }}>
                      <motion.div
                        className="w-full rounded-sm"
                        initial={{ height: 0, marginTop: "100%" }}
                        animate={{
                          height: `${dayPct}%`,
                          marginTop: `${100 - dayPct}%`,
                        }}
                        transition={{
                          delay: idx * 0.08,
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        }}
                        style={{
                          background: dayPct >= 100 ? "hsl(var(--success))" : "hsl(var(--info))",
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaterTracker;
