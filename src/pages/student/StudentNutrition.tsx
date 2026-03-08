import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DailyNutritionLog from "@/components/nutrition/DailyNutritionLog";
import { MealLogData } from "@/components/nutrition/DailyNutritionLog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import StudentRecommendationCards from "@/components/student/StudentRecommendationCards";
import FeatureGate from "@/components/plans/FeatureGate";

const StudentNutrition = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['nutrition', 'recommendations']);
  const [date] = useState(new Date());
  const [meals, setMeals] = useState<MealLogData[]>([]);

  const targets = {
    calorie_target: 2100,
    protein_g: 120,
    carbs_g: 240,
    fat_g: 65,
  };

  const handleAddMeal = (data: MealLogData) => {
    setMeals(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
    toast.success(t('nutrition:meal_added'));
  };

  const handleEditMeal = (data: MealLogData) => {
    setMeals(prev => prev.map(m => m.id === data.id ? data : m));
    toast.success(t('nutrition:meal_modified'));
  };

  const handleDeleteMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
    toast.success(t('nutrition:meal_deleted'));
  };

  return (
    <FeatureGate feature="nutrition_tracking" showLocked>
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{t('nutrition:daily_nutrition')}</h1>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <DailyNutritionLog
        date={date}
        meals={meals}
        onAddMeal={handleAddMeal}
        onEditMeal={handleEditMeal}
        onDeleteMeal={handleDeleteMeal}
        targets={targets}
      />

      {/* Coach nutrition tips */}
      <div className="space-y-2">
        <h2 className="font-bold text-sm">{t('recommendations:coach_tips')}</h2>
        <StudentRecommendationCards type="nutrition" />
      </div>
    </div>
  );
};

export default StudentNutrition;
