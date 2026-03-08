import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MacroDonut from "./MacroDonut";
import {
  calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros,
  ACTIVITY_MULTIPLIERS, OBJECTIVE_LABELS,
  type NutritionObjective, type Sex,
} from "@/lib/nutrition-calculator";

export interface NutritionProfileData {
  height_cm: number;
  weight_kg: number;
  age: number;
  sex: Sex;
  activity_multiplier: number;
  objective: NutritionObjective;
  bmr: number;
  tdee: number;
  calorie_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  dietary_restrictions: string[];
  allergies: string[];
}

interface NutritionProfileFormProps {
  initialData?: Partial<NutritionProfileData> | null;
  onSubmit: (data: NutritionProfileData) => void;
  isCoach?: boolean;
}

const RESTRICTION_OPTIONS = ["Sans gluten", "Végétarien", "Végan", "Sans lactose", "Halal", "Casher", "Pescétarien"];

const NutritionProfileForm = ({ initialData, onSubmit, isCoach }: NutritionProfileFormProps) => {
  const [height, setHeight] = useState(initialData?.height_cm || 165);
  const [weight, setWeight] = useState(initialData?.weight_kg || 60);
  const [age, setAge] = useState(initialData?.age || 30);
  const [sex, setSex] = useState<Sex>(initialData?.sex as Sex || "female");
  const [activityMult, setActivityMult] = useState(initialData?.activity_multiplier || 1.55);
  const [objective, setObjective] = useState<NutritionObjective>((initialData?.objective as NutritionObjective) || "maintenance");
  const [restrictions, setRestrictions] = useState<string[]>(initialData?.dietary_restrictions || []);
  const [manualOverride, setManualOverride] = useState(false);
  const [manualProtein, setManualProtein] = useState(0);
  const [manualCarbs, setManualCarbs] = useState(0);
  const [manualFat, setManualFat] = useState(0);

  const calculated = useMemo(() => {
    const bmr = calculateBMR(weight, height, age, sex);
    const tdee = calculateTDEE(bmr, activityMult);
    const calorieTarget = calculateCalorieTarget(tdee, objective);
    const macros = calculateMacros(weight, calorieTarget, objective);
    return { bmr, tdee, calorieTarget, ...macros };
  }, [weight, height, age, sex, activityMult, objective]);

  useEffect(() => {
    if (!manualOverride) {
      setManualProtein(calculated.protein_g);
      setManualCarbs(calculated.carbs_g);
      setManualFat(calculated.fat_g);
    }
  }, [calculated, manualOverride]);

  const finalProtein = manualOverride ? manualProtein : calculated.protein_g;
  const finalCarbs = manualOverride ? manualCarbs : calculated.carbs_g;
  const finalFat = manualOverride ? manualFat : calculated.fat_g;
  const finalCalories = manualOverride
    ? finalProtein * 4 + finalCarbs * 4 + finalFat * 9
    : calculated.calorieTarget;

  const toggleRestriction = (r: string) => {
    setRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSubmit = () => {
    onSubmit({
      height_cm: height, weight_kg: weight, age, sex,
      activity_multiplier: activityMult, objective,
      bmr: calculated.bmr, tdee: calculated.tdee,
      calorie_target: finalCalories,
      protein_g: finalProtein, carbs_g: finalCarbs, fat_g: finalFat,
      dietary_restrictions: restrictions, allergies: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Body metrics */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensurations</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sexe</label>
            <div className="flex gap-2">
              {(["female", "male"] as Sex[]).map(s => (
                <button key={s} onClick={() => setSex(s)}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                    sex === s ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                  )}>
                  {s === "female" ? "♀ Femme" : "♂ Homme"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Âge</label>
            <Input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="h-10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Taille (cm)</label>
            <Input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="h-10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Poids (kg)</label>
            <Input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="h-10" />
          </div>
        </div>
      </div>

      {/* Activity level */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Niveau d'activité</Label>
        <div className="space-y-1.5">
          {ACTIVITY_MULTIPLIERS.map(am => (
            <button key={am.value} onClick={() => setActivityMult(am.value)}
              className={cn("w-full text-left px-3 py-2.5 rounded-lg border transition-all",
                activityMult === am.value ? "border-primary bg-accent" : "border-border hover:border-primary/30"
              )}>
              <span className="text-sm font-medium">{am.label}</span>
              <span className="text-xs text-muted-foreground ml-2">{am.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Objective */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Objectif</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(OBJECTIVE_LABELS) as [NutritionObjective, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setObjective(key)}
              className={cn("py-2.5 rounded-lg text-sm font-medium border transition-all",
                objective === key ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calculated results */}
      <div className="glass p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Résultats calculés</Label>
          <div className="flex gap-3 text-xs">
            <span className="text-muted-foreground">BMR: <strong>{calculated.bmr}</strong> kcal</span>
            <span className="text-muted-foreground">TDEE: <strong>{calculated.tdee}</strong> kcal</span>
          </div>
        </div>

        <MacroDonut
          protein_g={finalProtein}
          carbs_g={finalCarbs}
          fat_g={finalFat}
          calorieTarget={finalCalories}
        />

        {/* Manual override toggle */}
        {isCoach && (
          <div className="space-y-3">
            <button
              onClick={() => setManualOverride(!manualOverride)}
              className={cn("w-full text-left text-xs font-medium px-3 py-2 rounded-lg border transition-all",
                manualOverride ? "border-primary bg-accent" : "border-border text-muted-foreground"
              )}>
              ✏️ {manualOverride ? "Override actif" : "Ajuster manuellement les macros"}
            </button>
            {manualOverride && (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Protéines (g)</label>
                  <Input type="number" value={manualProtein} onChange={e => setManualProtein(Number(e.target.value))} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Glucides (g)</label>
                  <Input type="number" value={manualCarbs} onChange={e => setManualCarbs(Number(e.target.value))} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Lipides (g)</label>
                  <Input type="number" value={manualFat} onChange={e => setManualFat(Number(e.target.value))} className="h-9 text-sm" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dietary restrictions */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restrictions alimentaires</Label>
        <div className="flex flex-wrap gap-1.5">
          {RESTRICTION_OPTIONS.map(r => (
            <button key={r} onClick={() => toggleRestriction(r)}
              className={cn("px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                restrictions.includes(r) ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
              )}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full h-12 font-semibold" onClick={handleSubmit}>
        Enregistrer le profil nutritionnel
      </Button>
    </div>
  );
};

export default NutritionProfileForm;
