import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import DailyNutritionLog from "@/components/nutrition/DailyNutritionLog";
import { MealLogData } from "@/components/nutrition/DailyNutritionLog";
import { toast } from "sonner";

const StudentNutrition = () => {
  const navigate = useNavigate();
  const [date] = useState(new Date());
  const [meals, setMeals] = useState<MealLogData[]>([]);

  // Demo targets (would come from nutrition_profiles)
  const targets = {
    calorie_target: 2100,
    protein_g: 120,
    carbs_g: 240,
    fat_g: 65,
  };

  const handleAddMeal = (data: MealLogData) => {
    setMeals(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
    toast.success("Repas ajouté !");
  };

  const handleEditMeal = (data: MealLogData) => {
    setMeals(prev => prev.map(m => m.id === data.id ? data : m));
    toast.success("Repas modifié !");
  };

  const handleDeleteMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
    toast.success("Repas supprimé");
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <div>
          <h1 className="text-xl font-bold">🍽 Nutrition du jour</h1>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
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
    </div>
  );
};

export default StudentNutrition;
