import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Apple } from "lucide-react";
import NutritionProfileForm, { NutritionProfileData } from "@/components/nutrition/NutritionProfileForm";
import MacroDonut from "@/components/nutrition/MacroDonut";
import { toast } from "sonner";

const StudentProfile = () => {
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfileData | null>(null);

  const handleNutritionSubmit = (data: NutritionProfileData) => {
    setNutritionProfile(data);
    toast.success("Profil nutritionnel enregistré !");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Mon Profil</h1>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="info" className="flex-1 gap-1.5">
            <User className="w-3.5 h-3.5" strokeWidth={1.5} />
            Infos
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex-1 gap-1.5">
            <Apple className="w-3.5 h-3.5" strokeWidth={1.5} />
            Nutrition
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="glass p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                <User className="w-8 h-8 text-accent-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-bold text-lg">Élève</h2>
                <p className="text-sm text-muted-foreground">Athlète</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Objectif</p>
                <p className="font-medium text-sm mt-1">{nutritionProfile?.objective ? {
                  muscle_gain: "Prise de masse",
                  fat_loss: "Sèche",
                  maintenance: "Maintien",
                  recomp: "Recomp",
                }[nutritionProfile.objective] : "Non défini"}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Niveau</p>
                <p className="font-medium text-sm mt-1">Non défini</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Poids</p>
                <p className="font-medium text-sm mt-1">{nutritionProfile?.weight_kg ? `${nutritionProfile.weight_kg} kg` : "Non défini"}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Taille</p>
                <p className="font-medium text-sm mt-1">{nutritionProfile?.height_cm ? `${nutritionProfile.height_cm} cm` : "Non défini"}</p>
              </div>
            </div>

            {nutritionProfile && (
              <div className="glass p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Objectifs macros</p>
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
