// Mifflin-St Jeor BMR calculation + macro distribution

export type NutritionObjective = "muscle_gain" | "fat_loss" | "maintenance" | "recomp";
export type Sex = "male" | "female";

export const OBJECTIVE_LABELS: Record<NutritionObjective, string> = {
  muscle_gain: "Prise de masse",
  fat_loss: "Sèche",
  maintenance: "Maintien",
  recomp: "Recomposition",
};

export const ACTIVITY_MULTIPLIERS = [
  { value: 1.2, label: "Sédentaire", desc: "Peu ou pas d'exercice" },
  { value: 1.375, label: "Légèrement actif", desc: "1-3 séances/semaine" },
  { value: 1.55, label: "Modérément actif", desc: "3-5 séances/semaine" },
  { value: 1.725, label: "Très actif", desc: "6-7 séances/semaine" },
  { value: 1.9, label: "Extrêmement actif", desc: "Athlète, 2x/jour" },
];

export function calculateBMR(weight: number, height: number, age: number, sex: Sex): number {
  if (sex === "male") {
    return Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5);
  }
  return Math.round((10 * weight) + (6.25 * height) - (5 * age) - 161);
}

export function calculateTDEE(bmr: number, multiplier: number): number {
  return Math.round(bmr * multiplier);
}

export function calculateCalorieTarget(tdee: number, objective: NutritionObjective): number {
  switch (objective) {
    case "muscle_gain": return tdee + 400;
    case "fat_loss": return tdee - 400;
    case "maintenance": return tdee;
    case "recomp": return tdee;
  }
}

export function calculateMacros(
  weight: number,
  calorieTarget: number,
  objective: NutritionObjective
): { protein_g: number; carbs_g: number; fat_g: number } {
  let proteinPerKg: number, fatPerKg: number;

  switch (objective) {
    case "muscle_gain":
      proteinPerKg = 2.0; fatPerKg = 1.0; break;
    case "fat_loss":
      proteinPerKg = 2.2; fatPerKg = 0.9; break;
    case "maintenance":
    case "recomp":
    default:
      proteinPerKg = 1.8; fatPerKg = 1.0; break;
  }

  const protein_g = Math.round(proteinPerKg * weight);
  const fat_g = Math.round(fatPerKg * weight);
  const proteinCals = protein_g * 4;
  const fatCals = fat_g * 9;
  const carbs_g = Math.max(0, Math.round((calorieTarget - proteinCals - fatCals) / 4));

  return { protein_g, carbs_g, fat_g };
}
