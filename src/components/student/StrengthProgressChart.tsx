import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStrengthProgress } from "@/hooks/useStrengthProgress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp } from "lucide-react";
import { getExerciseName } from "@/lib/exercise-utils";

const StrengthProgressChart = () => {
  const { t } = useTranslation("dashboard");
  const { exercises, selectedExercise, setSelectedExercise, dataPoints, loading } = useStrengthProgress();
  const [mode, setMode] = useState<"maxWeight" | "totalVolume">("maxWeight");

  if (exercises.length === 0) {
    return (
      <div className="glass p-6 text-center space-y-2">
        <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
        <h3 className="font-semibold">{t("strength_progress")}</h3>
        <p className="text-sm text-muted-foreground">{t("no_exercise_data")}</p>
      </div>
    );
  }

  return (
    <div className="glass p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">{t("strength_progress")}</h2>
        <div className="flex gap-2">
          <Select value={selectedExercise || ""} onValueChange={setSelectedExercise}>
            <SelectTrigger className="h-8 text-xs w-[180px]">
              <SelectValue placeholder={t("select_exercise")} />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((ex) => (
                <SelectItem key={ex.exerciseId} value={ex.exerciseId}>
                  {ex.exerciseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex bg-secondary rounded-md">
            <button
              onClick={() => setMode("maxWeight")}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                mode === "maxWeight" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t("max_weight")}
            </button>
            <button
              onClick={() => setMode("totalVolume")}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                mode === "totalVolume" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t("total_volume_label")}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : dataPoints.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">{t("no_exercise_data")}</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dataPoints}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
              labelFormatter={(v) => new Date(v).toLocaleDateString()}
              formatter={(value: number) => [
                mode === "maxWeight" ? `${value} kg` : `${value} kg`,
                mode === "maxWeight" ? t("max_weight") : t("total_volume_label")
              ]}
            />
            <Line
              type="monotone"
              dataKey={mode}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      <p className="text-[10px] text-muted-foreground text-center">{t("last_sessions")}</p>
    </div>
  );
};

export default StrengthProgressChart;
