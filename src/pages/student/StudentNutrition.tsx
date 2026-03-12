import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DailyNutritionLog from "@/components/nutrition/DailyNutritionLog";
import { MealLogData } from "@/components/nutrition/DailyNutritionLog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import StudentRecommendationCards from "@/components/student/StudentRecommendationCards";
import FeatureGate from "@/components/plans/FeatureGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const StudentNutrition = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['nutrition', 'recommendations']);
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [meals, setMeals] = useState<MealLogData[]>([]);
  const [targets, setTargets] = useState<{ calorie_target: number; protein_g: number; carbs_g: number; fat_g: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const dateStr = date.toISOString().split("T")[0];

  // Fetch nutrition profile targets
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("nutrition_profiles")
        .select("calorie_target, protein_g, carbs_g, fat_g")
        .eq("student_id", user.id)
        .maybeSingle();
      if (data && data.calorie_target) {
        setTargets({
          calorie_target: data.calorie_target,
          protein_g: data.protein_g || 0,
          carbs_g: data.carbs_g || 0,
          fat_g: data.fat_g || 0,
        });
      } else {
        // Fallback defaults
        setTargets({ calorie_target: 2100, protein_g: 120, carbs_g: 240, fat_g: 65 });
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch meals for the selected date
  useEffect(() => {
    if (!user) return;
    const fetchMeals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("daily_nutrition_logs")
        .select("*")
        .eq("student_id", user.id)
        .eq("date", dateStr)
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching meals:", error);
      } else {
        setMeals((data || []).map(m => ({
          id: m.id,
          meal_type: m.meal_type,
          description: m.description,
          calories: m.calories ?? undefined,
          protein_g: m.protein_g ?? undefined,
          carbs_g: m.carbs_g ?? undefined,
          fat_g: m.fat_g ?? undefined,
          photo_url: m.photo_url ?? undefined,
          notes: m.notes ?? undefined,
        })));
      }
      setLoading(false);
    };
    fetchMeals();
  }, [user, dateStr]);

  const handleAddMeal = async (data: MealLogData) => {
    if (!user) return;
    const { data: inserted, error } = await supabase
      .from("daily_nutrition_logs")
      .insert({
        student_id: user.id,
        date: dateStr,
        meal_type: data.meal_type,
        description: data.description,
        calories: data.calories ?? null,
        protein_g: data.protein_g ?? null,
        carbs_g: data.carbs_g ?? null,
        fat_g: data.fat_g ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    
    if (error) {
      toast.error(t('common:error'));
      console.error(error);
    } else if (inserted) {
      setMeals(prev => [...prev, {
        id: inserted.id,
        meal_type: inserted.meal_type,
        description: inserted.description,
        calories: inserted.calories ?? undefined,
        protein_g: inserted.protein_g ?? undefined,
        carbs_g: inserted.carbs_g ?? undefined,
        fat_g: inserted.fat_g ?? undefined,
        notes: inserted.notes ?? undefined,
      }]);
      toast.success(t('nutrition:meal_added'));
    }
  };

  const handleEditMeal = async (data: MealLogData) => {
    if (!data.id) return;
    const { error } = await supabase
      .from("daily_nutrition_logs")
      .update({
        meal_type: data.meal_type,
        description: data.description,
        calories: data.calories ?? null,
        protein_g: data.protein_g ?? null,
        carbs_g: data.carbs_g ?? null,
        fat_g: data.fat_g ?? null,
        notes: data.notes ?? null,
      })
      .eq("id", data.id);
    
    if (error) {
      toast.error(t('common:error'));
    } else {
      setMeals(prev => prev.map(m => m.id === data.id ? data : m));
      toast.success(t('nutrition:meal_modified'));
    }
  };

  const handleDeleteMeal = async (id: string) => {
    const { error } = await supabase
      .from("daily_nutrition_logs")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error(t('common:error'));
    } else {
      setMeals(prev => prev.filter(m => m.id !== id));
      toast.success(t('nutrition:meal_deleted'));
    }
  };

  // Navigate between days
  const goToDay = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d);
  };

  return (
    <FeatureGate feature="nutrition_tracking" showLocked>
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{t('nutrition:daily_nutrition')}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => goToDay(-1)} className="text-xs text-muted-foreground hover:text-foreground">←</button>
            <p className="text-xs text-muted-foreground">
              {date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <button onClick={() => goToDay(1)} className="text-xs text-muted-foreground hover:text-foreground">→</button>
          </div>
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
    </FeatureGate>
  );
};

export default StudentNutrition;
