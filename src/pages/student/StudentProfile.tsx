import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Apple, Bell } from "lucide-react";
import NutritionProfileForm, { NutritionProfileData } from "@/components/nutrition/NutritionProfileForm";
import MacroDonut from "@/components/nutrition/MacroDonut";
import NotificationSettings from "@/components/student/NotificationSettings";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const StudentProfile = () => {
  const { t } = useTranslation(['nutrition', 'dashboard', 'common', 'settings']);
  const isAdvanced = useIsAdvanced();
  const { user } = useAuth();
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load nutrition profile from database
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("nutrition_profiles")
        .select("*")
        .eq("student_id", user.id)
        .maybeSingle();

      if (data && !error) {
        setNutritionProfile({
          height_cm: data.height_cm ?? 0,
          weight_kg: data.weight_kg ?? 0,
          age: data.age ?? 0,
          sex: (data.sex as "male" | "female") ?? "male",
          activity_multiplier: data.activity_multiplier ?? 1.55,
          objective: (data.objective as NutritionProfileData["objective"]) ?? "maintenance",
          bmr: data.bmr ?? 0,
          tdee: data.tdee ?? 0,
          calorie_target: data.calorie_target ?? 0,
          protein_g: data.protein_g ?? 0,
          carbs_g: data.carbs_g ?? 0,
          fat_g: data.fat_g ?? 0,
          dietary_restrictions: data.dietary_restrictions ?? [],
          allergies: data.allergies ?? [],
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleNutritionSubmit = async (data: NutritionProfileData) => {
    if (!user) return;

    const payload = {
      student_id: user.id,
      height_cm: data.height_cm,
      weight_kg: data.weight_kg,
      age: data.age,
      sex: data.sex,
      activity_multiplier: data.activity_multiplier,
      objective: data.objective,
      bmr: data.bmr,
      tdee: data.tdee,
      calorie_target: data.calorie_target,
      protein_g: data.protein_g,
      carbs_g: data.carbs_g,
      fat_g: data.fat_g,
      dietary_restrictions: data.dietary_restrictions,
      allergies: data.allergies,
      updated_by: user.id,
    };

    const { error } = await supabase
      .from("nutrition_profiles")
      .upsert(payload, { onConflict: "student_id" });

    if (error) {
      console.error("Error saving nutrition profile:", error);
      toast.error(t('common:error'));
      return;
    }

    setNutritionProfile(data);
    toast.success(t('nutrition:profile_saved'));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard:my_profile')}</h1>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="info" className="flex-1 gap-1.5">
            <User className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t('nutrition:info_tab')}
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex-1 gap-1.5">
            <Apple className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t('nutrition:nutrition_tab')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 gap-1.5">
            <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t('settings:notif_title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="glass p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                <User className="w-8 h-8 text-accent-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-bold text-lg">{t('common:roles.student')}</h2>
                <p className="text-sm text-muted-foreground">{t('dashboard:athlete')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{t('dashboard:goal')}</p>
                <p className="font-medium text-sm mt-1">{nutritionProfile?.objective ? t(`nutrition:${nutritionProfile.objective}`) : t('dashboard:not_defined')}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{t('dashboard:level')}</p>
                <p className="font-medium text-sm mt-1">{t('dashboard:not_defined')}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{t('nutrition:weight')}</p>
                <p className="font-medium text-sm mt-1">{nutritionProfile?.weight_kg ? `${nutritionProfile.weight_kg} kg` : t('dashboard:not_defined')}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{t('nutrition:height')}</p>
                <p className="font-medium text-sm mt-1">{nutritionProfile?.height_cm ? `${nutritionProfile.height_cm} cm` : t('dashboard:not_defined')}</p>
              </div>
            </div>

            {nutritionProfile && (
              <div className="glass p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t('nutrition:macro_targets')}</p>
                {isAdvanced ? (
                  <MacroDonut
                    protein_g={nutritionProfile.protein_g}
                    carbs_g={nutritionProfile.carbs_g}
                    fat_g={nutritionProfile.fat_g}
                    calorieTarget={nutritionProfile.calorie_target}
                    size={120}
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{nutritionProfile.calorie_target}</p>
                    <p className="text-sm text-muted-foreground">kcal / {t('nutrition:day', 'jour')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="mt-4">
          <div className="glass p-5">
            <NutritionProfileForm
              initialData={nutritionProfile}
              onSubmit={handleNutritionSubmit}
            />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProfile;
