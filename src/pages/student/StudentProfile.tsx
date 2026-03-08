import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Apple } from "lucide-react";
import NutritionProfileForm, { NutritionProfileData } from "@/components/nutrition/NutritionProfileForm";
import MacroDonut from "@/components/nutrition/MacroDonut";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const StudentProfile = () => {
  const { t } = useTranslation(['nutrition', 'dashboard', 'common']);
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfileData | null>(null);

  const handleNutritionSubmit = (data: NutritionProfileData) => {
    setNutritionProfile(data);
    toast.success(t('nutrition:profile_saved'));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
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
                <MacroDonut
                  protein_g={nutritionProfile.protein_g}
                  carbs_g={nutritionProfile.carbs_g}
                  fat_g={nutritionProfile.fat_g}
                  calorieTarget={nutritionProfile.calorie_target}
                  size={120}
                />
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
      </Tabs>
    </div>
  );
};

export default StudentProfile;