import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const categoryColors: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  pre_workout: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  post_workout: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  breakfast: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  lunch: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  dinner: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  snack: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  hydration: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  supplements: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  stretching: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  foam_rolling: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  mobility: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sleep: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  active_recovery: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  cold_therapy: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  massage: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  rest_day_protocol: "bg-muted text-muted-foreground",
};

const RecommendationCategoryBadge = ({ category }: { category: string }) => {
  const { t } = useTranslation("recommendations");
  const colorClass = categoryColors[category] || "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={`text-[10px] border-0 ${colorClass}`}>
      {t(`cat_${category}`, category)}
    </Badge>
  );
};

export default RecommendationCategoryBadge;
