// Alternatives d'exercices par groupe musculaire
// Chaque exercice du programme a des alternatives possibles

export interface ExerciseAlternative {
  name: string;
  equipment: string;
  difficulty: "easy" | "medium" | "hard";
  reason: string; // pourquoi c'est une bonne alternative
}

export interface AlternativeGroup {
  muscleGroup: string;
  alternatives: ExerciseAlternative[];
}

// Map: exercise name → alternatives
export const EXERCISE_ALTERNATIVES: Record<string, AlternativeGroup> = {
  "Hip Thrust Barre": {
    muscleGroup: "Fessiers",
    alternatives: [
      { name: "Hip Thrust Machine", equipment: "Machine", difficulty: "easy", reason: "Même mouvement, setup plus rapide" },
      { name: "Hip Thrust Haltère", equipment: "Haltère", difficulty: "easy", reason: "Moins de charge mais accessible" },
      { name: "Glute Bridge Barre (au sol)", equipment: "Barre", difficulty: "medium", reason: "ROM réduit mais même pattern" },
      { name: "B-Stance Hip Thrust", equipment: "Barre", difficulty: "hard", reason: "Unilatéral, plus de recrutement" },
    ],
  },
  "Romanian Deadlift (RDL) Barre": {
    muscleGroup: "Ischios / Fessiers",
    alternatives: [
      { name: "RDL Haltères", equipment: "Haltères", difficulty: "easy", reason: "Plus de liberté de mouvement" },
      { name: "B-Stance RDL", equipment: "Haltère", difficulty: "medium", reason: "Unilatéral, corrige les asymétries" },
      { name: "Sumo RDL", equipment: "Barre", difficulty: "medium", reason: "Cible davantage les adducteurs" },
      { name: "Good Morning", equipment: "Barre", difficulty: "hard", reason: "Même pattern, plus exigeant sur le dos" },
    ],
  },
  "Bulgarian Split Squat (haltères)": {
    muscleGroup: "Quadriceps / Fessiers",
    alternatives: [
      { name: "Reverse Lunge", equipment: "Haltères", difficulty: "easy", reason: "Moins de stabilité requise" },
      { name: "Split Squat classique", equipment: "Haltères", difficulty: "easy", reason: "Sans surélévation du pied arrière" },
      { name: "Walking Lunge", equipment: "Haltères", difficulty: "medium", reason: "Dynamique, travaille aussi la coordination" },
      { name: "Front Foot Elevated Split Squat", equipment: "Haltères", difficulty: "hard", reason: "Plus de ROM pour les fessiers" },
    ],
  },
  "Step-Up sur box haute (haltères)": {
    muscleGroup: "Fessiers / Quadriceps",
    alternatives: [
      { name: "Step-Up sans charge", equipment: "PDC", difficulty: "easy", reason: "Focus technique et équilibre" },
      { name: "Lateral Step-Up", equipment: "Haltères", difficulty: "medium", reason: "Travaille le plan frontal" },
      { name: "Deficit Reverse Lunge", equipment: "Haltères", difficulty: "medium", reason: "Plus de ROM, excellent pour les glutes" },
    ],
  },
  "Cable Pull-Through": {
    muscleGroup: "Fessiers / Ischios",
    alternatives: [
      { name: "Kettlebell Swing", equipment: "Kettlebell", difficulty: "medium", reason: "Même pattern hip hinge, plus explosif" },
      { name: "Band Pull-Through", equipment: "Élastique", difficulty: "easy", reason: "Même mouvement, portable" },
      { name: "Hyperextension (GHD)", equipment: "Machine", difficulty: "medium", reason: "Extension de hanche, excellent pump" },
    ],
  },
  "Cable Kickback (poulie basse)": {
    muscleGroup: "Fessiers",
    alternatives: [
      { name: "Kickback élastique", equipment: "Élastique", difficulty: "easy", reason: "Même mouvement, tension progressive" },
      { name: "Donkey Kick (machine)", equipment: "Machine", difficulty: "easy", reason: "Guidé, isolation parfaite" },
      { name: "Fire Hydrant (lesté)", equipment: "Élastique", difficulty: "medium", reason: "Abduction + extension" },
    ],
  },
  "Seated Abduction Machine": {
    muscleGroup: "Fessiers (moyen)",
    alternatives: [
      { name: "Band Seated Abduction", equipment: "Élastique", difficulty: "easy", reason: "Même mouvement sans machine" },
      { name: "Side-Lying Hip Abduction", equipment: "Poids cheville", difficulty: "easy", reason: "Isolation gluteus medius" },
      { name: "Cable Standing Abduction", equipment: "Poulie", difficulty: "medium", reason: "Debout, plus fonctionnel" },
    ],
  },
};
