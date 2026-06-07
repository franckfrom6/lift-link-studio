import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ExerciseSeed = {
  name: string;
  name_en: string;
  muscle_group: string;
  secondary_muscle: string | null;
  equipment: string;
  type: string;
  tracking_type: string;
  public_cible: string;
  description: string;
};

const NOUVEAUX_EXERCICES: ExerciseSeed[] = [
  {
    name: "Crossover câble",
    name_en: "Cable Crossover",
    muscle_group: "Pectoraux",
    secondary_muscle: "Épaules antérieures",
    equipment: "Câbles",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Debout entre deux poulies hautes, amène les poignées vers le centre en arc de cercle. Squeeze les pectoraux en fin de mouvement.",
  },
  {
    name: "Pec deck",
    name_en: "Pec Deck Machine",
    muscle_group: "Pectoraux",
    secondary_muscle: null,
    equipment: "Machine",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Assis face à la machine, amène les bras vers le centre en maintenant les coudes à 90°. Isolation pectorale maximale.",
  },
  {
    name: "Développé couché prise serrée",
    name_en: "Close-Grip Bench Press",
    muscle_group: "Pectoraux",
    secondary_muscle: "Triceps",
    equipment: "Barre",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Développé couché avec prise à largeur d'épaules. Cible les triceps et la partie interne des pectoraux.",
  },
  {
    name: "Pompes inclinées",
    name_en: "Incline Push-Up",
    muscle_group: "Pectoraux",
    secondary_muscle: "Triceps, Épaules",
    equipment: "Poids de corps",
    type: "compound",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "Pompes avec les mains surélevées sur un banc ou une boîte. Plus facile que les pompes standard — idéal pour débuter.",
  },
  {
    name: "Pompes déclinées",
    name_en: "Decline Push-Up",
    muscle_group: "Pectoraux",
    secondary_muscle: "Triceps, Épaules",
    equipment: "Poids de corps",
    type: "compound",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "Pompes avec les pieds surélevés sur un banc. Accentue le travail de la partie haute des pectoraux.",
  },
  {
    name: "Développé couché haltères",
    name_en: "Dumbbell Bench Press",
    muscle_group: "Pectoraux",
    secondary_muscle: "Triceps, Épaules",
    equipment: "Haltères",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Développé couché avec haltères. Plus grande amplitude et travail de stabilisation accru comparé à la barre.",
  },
  {
    name: "Tirage horizontal câble",
    name_en: "Seated Cable Row",
    muscle_group: "Dos",
    secondary_muscle: "Biceps, Trapèzes",
    equipment: "Câbles",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Assis face à la poulie basse, tire la barre en V vers le ventre en gardant le dos droit. Travaille le milieu du dos.",
  },
  {
    name: "Tirage poitrine prise serrée",
    name_en: "Close-Grip Lat Pulldown",
    muscle_group: "Dos",
    secondary_muscle: "Biceps",
    equipment: "Câbles",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Tirage vertical avec prise neutre serrée. Isole davantage les grands dorsaux et sollicite moins les biceps.",
  },
  {
    name: "Rowing machine",
    name_en: "Machine Row",
    muscle_group: "Dos",
    secondary_muscle: "Biceps",
    equipment: "Machine",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Rowing sur machine guidée. Idéal pour isoler le dos sans soliciter les stabilisateurs.",
  },
  {
    name: "Hyperextension",
    name_en: "Back Extension",
    muscle_group: "Dos",
    secondary_muscle: "Fessiers, Ischio-jambiers",
    equipment: "Poids de corps",
    type: "isolation",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "Sur le banc à lombaires, monte le tronc depuis la position fléchie jusqu'à l'horizontale. Renforce les érecteurs spinaux.",
  },
  {
    name: "Pullover haltère",
    name_en: "Dumbbell Pullover",
    muscle_group: "Dos",
    secondary_muscle: "Pectoraux",
    equipment: "Haltères",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Allongé sur un banc, tient un haltère à deux mains et descend les bras derrière la tête en arc de cercle. Étire et contracte les grands dorsaux.",
  },
  {
    name: "Développé militaire haltères",
    name_en: "Dumbbell Overhead Press",
    muscle_group: "Épaules",
    secondary_muscle: "Triceps",
    equipment: "Haltères",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Développé vertical assis ou debout avec haltères. Permet une rotation naturelle des poignets et un travail unilatéral.",
  },
  {
    name: "Arnold press",
    name_en: "Arnold Press",
    muscle_group: "Épaules",
    secondary_muscle: "Triceps",
    equipment: "Haltères",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Développé avec rotation des poignets de la position neutre en bas à la position pronation en haut. Cible les 3 portions des deltoïdes.",
  },
  {
    name: "Élévations latérales câble",
    name_en: "Cable Lateral Raise",
    muscle_group: "Épaules",
    secondary_muscle: null,
    equipment: "Câbles",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Élévations latérales avec câble bas. La tension est constante tout au long du mouvement, contrairement aux haltères.",
  },
  {
    name: "Élévations frontales haltères",
    name_en: "Dumbbell Front Raise",
    muscle_group: "Épaules",
    secondary_muscle: "Pectoraux supérieurs",
    equipment: "Haltères",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Monte les bras devant toi jusqu'à la hauteur des épaules, pouces vers le haut. Cible le faisceau antérieur du deltoïde.",
  },
  {
    name: "Oiseau machine",
    name_en: "Reverse Pec Deck",
    muscle_group: "Épaules",
    secondary_muscle: "Trapèzes",
    equipment: "Machine",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Sur la machine pec deck à l'envers, écarte les bras en arrière. Isole parfaitement le deltoïde postérieur.",
  },
  {
    name: "Curl barre",
    name_en: "Barbell Curl",
    muscle_group: "Biceps",
    secondary_muscle: null,
    equipment: "Barre",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Curl debout avec barre droite ou EZ. Permet de charger plus lourd que les haltères.",
  },
  {
    name: "Curl pupitre",
    name_en: "Preacher Curl",
    muscle_group: "Biceps",
    secondary_muscle: null,
    equipment: "Barre",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Curl sur pupitre, les bras posés sur le support incliné. Élimine la triche et isole la partie basse du biceps.",
  },
  {
    name: "Curl câble",
    name_en: "Cable Curl",
    muscle_group: "Biceps",
    secondary_muscle: null,
    equipment: "Câbles",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Curl avec câble bas. Tension constante sur tout le range of motion, idéal pour le pump.",
  },
  {
    name: "Extension triceps barre au front",
    name_en: "Skull Crusher",
    muscle_group: "Triceps",
    secondary_muscle: null,
    equipment: "Barre",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Allongé sur banc, descend la barre vers le front en gardant les coudes fixes. Cible les 3 chefs du triceps.",
  },
  {
    name: "Extension triceps overhead haltère",
    name_en: "Overhead Triceps Extension",
    muscle_group: "Triceps",
    secondary_muscle: null,
    equipment: "Haltères",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Haltère tenu à deux mains, descend derrière la tête en gardant les coudes vers le plafond. Étire et sollicite le chef long.",
  },
  {
    name: "Pushdown barre",
    name_en: "Triceps Pushdown Bar",
    muscle_group: "Triceps",
    secondary_muscle: null,
    equipment: "Câbles",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Debout face à la poulie haute, pousse la barre vers le bas en gardant les coudes collés au corps.",
  },
  {
    name: "Hack squat",
    name_en: "Hack Squat",
    muscle_group: "Jambes",
    secondary_muscle: "Fessiers",
    equipment: "Machine",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Squat sur machine inclinée avec dos plaqué. Accent sur le quadriceps, moins de charge sur le bas du dos que le squat barre.",
  },
  {
    name: "Squat sumo",
    name_en: "Sumo Squat",
    muscle_group: "Jambes",
    secondary_muscle: "Fessiers, Adducteurs",
    equipment: "Haltères",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Squat avec écartement large et pieds pointés vers l'extérieur. Sollicite davantage les adducteurs et les fessiers.",
  },
  {
    name: "Squat goblet pause",
    name_en: "Pause Goblet Squat",
    muscle_group: "Jambes",
    secondary_muscle: "Fessiers, Core",
    equipment: "Kettlebell",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Goblet squat avec 2-3 secondes de pause en bas. Améliore la mobilité des hanches et le contrôle en position basse.",
  },
  {
    name: "Wall sit",
    name_en: "Wall Sit",
    muscle_group: "Jambes",
    secondary_muscle: null,
    equipment: "Poids de corps",
    type: "isolation",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Dos au mur, genoux à 90°, maintenir la position. Endurance musculaire des quadriceps.",
  },
  {
    name: "Good morning",
    name_en: "Good Morning",
    muscle_group: "Jambes",
    secondary_muscle: "Dos, Fessiers",
    equipment: "Barre",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Barre sur les épaules, incline le tronc vers l'avant en gardant les genoux légèrement fléchis. Renforce les ischio-jambiers et les érecteurs.",
  },
  {
    name: "Balancé kettlebell",
    name_en: "Kettlebell Swing",
    muscle_group: "Fessiers",
    secondary_muscle: "Ischio-jambiers, Dos",
    equipment: "Kettlebell",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Swingue le kettlebell de l'entre-jambes jusqu'à la hauteur des yeux en explosant avec les hanches. Puissance postérieure maximale.",
  },
  {
    name: "Hip thrust haltères",
    name_en: "Dumbbell Hip Thrust",
    muscle_group: "Fessiers",
    secondary_muscle: null,
    equipment: "Haltères",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Hip thrust avec haltère posé sur les hanches. Alternative accessible à la barre, idéale pour progresser.",
  },
  {
    name: "Hip thrust élastique",
    name_en: "Banded Hip Thrust",
    muscle_group: "Fessiers",
    secondary_muscle: null,
    equipment: "Élastique",
    type: "compound",
    tracking_type: "reps_only",
    public_cible: "femme",
    description: "Hip thrust avec élastique sur les hanches ou les genoux. Parfait pour activer les fessiers et les abducteurs simultanément.",
  },
  {
    name: "Deadlift roumain unilatéral",
    name_en: "Single-Leg Romanian Deadlift",
    muscle_group: "Fessiers",
    secondary_muscle: "Ischio-jambiers, Core",
    equipment: "Haltères",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "RDL sur une jambe. Corrige les déséquilibres gauche/droite et exige une forte stabilisation du core et de la cheville.",
  },
  {
    name: "Abduction machine",
    name_en: "Hip Abduction Machine",
    muscle_group: "Fessiers",
    secondary_muscle: null,
    equipment: "Machine",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "femme",
    description: "Assis sur la machine, écarte les jambes contre la résistance. Cible les fessiers moyens et les TFL.",
  },
  {
    name: "Adduction machine",
    name_en: "Hip Adduction Machine",
    muscle_group: "Jambes",
    secondary_muscle: null,
    equipment: "Machine",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "femme",
    description: "Assis sur la machine, ramène les jambes contre la résistance. Cible les adducteurs de la cuisse.",
  },
  {
    name: "Donkey kick",
    name_en: "Donkey Kick",
    muscle_group: "Fessiers",
    secondary_muscle: null,
    equipment: "Poids de corps",
    type: "isolation",
    tracking_type: "reps_only",
    public_cible: "femme",
    description: "À quatre pattes, pousse une jambe vers l'arrière et le haut en gardant le genou fléchi. Isole le grand fessier.",
  },
  {
    name: "Fire hydrant",
    name_en: "Fire Hydrant",
    muscle_group: "Fessiers",
    secondary_muscle: null,
    equipment: "Poids de corps",
    type: "isolation",
    tracking_type: "reps_only",
    public_cible: "femme",
    description: "À quatre pattes, lève une jambe fléchie sur le côté. Cible le fessier moyen et les abducteurs.",
  },
  {
    name: "Mollets assis",
    name_en: "Seated Calf Raise",
    muscle_group: "Mollets",
    secondary_muscle: null,
    equipment: "Machine",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Mollets assis sur machine, genoux fléchis. Cible le soléaire (muscle sous le gastrocnémien), souvent négligé.",
  },
  {
    name: "Mollets debout haltères",
    name_en: "Dumbbell Calf Raise",
    muscle_group: "Mollets",
    secondary_muscle: null,
    equipment: "Haltères",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Élévations sur la pointe des pieds avec haltères. Alternative sans machine, idéale pour entraînement à la maison.",
  },
  {
    name: "Relevé de jambes",
    name_en: "Hanging Leg Raise",
    muscle_group: "Abdominaux",
    secondary_muscle: "Fléchisseurs de hanches",
    equipment: "Poids de corps",
    type: "isolation",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "Suspendu à une barre, monte les jambes tendues ou fléchies jusqu'à l'horizontale. Cible les abdominaux bas et les fléchisseurs.",
  },
  {
    name: "Crunch câble",
    name_en: "Cable Crunch",
    muscle_group: "Abdominaux",
    secondary_muscle: null,
    equipment: "Câbles",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "À genoux face à la poulie haute, fléchis le tronc vers le bas avec la corde. Permet d'ajouter de la charge sur les abdominaux.",
  },
  {
    name: "Russian twist",
    name_en: "Russian Twist",
    muscle_group: "Abdominaux",
    secondary_muscle: null,
    equipment: "Poids de corps",
    type: "isolation",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "Assis au sol, tronc incliné à 45°, pivote le buste de gauche à droite. Cible les obliques. Peut se faire avec poids ou médecine ball.",
  },
  {
    name: "Ab wheel",
    name_en: "Ab Wheel Rollout",
    muscle_group: "Abdominaux",
    secondary_muscle: "Dos, Épaules",
    equipment: "Poids de corps",
    type: "compound",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "À genoux avec la roue ab, roule vers l'avant en gardant le core verrouillé puis reviens. Exercice difficile, excellent pour le gainage dynamique.",
  },
  {
    name: "Dead bug",
    name_en: "Dead Bug",
    muscle_group: "Abdominaux",
    secondary_muscle: null,
    equipment: "Poids de corps",
    type: "isolation",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "Sur le dos, bras vers le plafond, genoux à 90°. Descend alternativement un bras et la jambe opposée sans décoller le bas du dos.",
  },
  {
    name: "Bird dog",
    name_en: "Bird Dog",
    muscle_group: "Abdominaux",
    secondary_muscle: "Dos, Fessiers",
    equipment: "Poids de corps",
    type: "isolation",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "À quatre pattes, étend simultanément le bras droit et la jambe gauche. Renforce la stabilité lombaire et le contrôle moteur.",
  },
  {
    name: "Planche latérale",
    name_en: "Side Plank",
    muscle_group: "Abdominaux",
    secondary_muscle: "Épaules",
    equipment: "Poids de corps",
    type: "isolation",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Appui latéral sur l'avant-bras, corps en ligne droite. Cible les obliques et les stabilisateurs latéraux du tronc.",
  },
  {
    name: "Mountain climbers",
    name_en: "Mountain Climbers",
    muscle_group: "Abdominaux",
    secondary_muscle: "Épaules, Fléchisseurs",
    equipment: "Poids de corps",
    type: "compound",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "En position de pompe, ramène alternativement les genoux vers la poitrine en rythme rapide. Cardio + gainage combinés.",
  },
  {
    name: "Vélo stationnaire",
    name_en: "Stationary Bike",
    muscle_group: "Cardio",
    secondary_muscle: null,
    equipment: "Machine",
    type: "cardio",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Cardio en salle sur vélo. Faible impact articulaire, idéal pour l'endurance ou les séances de récupération active.",
  },
  {
    name: "Rameur",
    name_en: "Rowing Machine",
    muscle_group: "Cardio",
    secondary_muscle: "Dos, Jambes",
    equipment: "Machine",
    type: "cardio",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Cardio plein corps sur rameur. Sollicite 86% des muscles du corps, excellent rapport effort/résultat.",
  },
  {
    name: "Corde à sauter",
    name_en: "Jump Rope",
    muscle_group: "Cardio",
    secondary_muscle: "Mollets, Épaules",
    equipment: "Poids de corps",
    type: "cardio",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Cardio au saut de corde. Améliore la coordination, l'endurance et brûle plus de calories que la course à allure modérée.",
  },
  {
    name: "Burpees",
    name_en: "Burpees",
    muscle_group: "Cardio",
    secondary_muscle: "Pectoraux, Jambes, Épaules",
    equipment: "Poids de corps",
    type: "cardio",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "Enchaîne une pompe, un saut les pieds vers les mains et un saut vertical avec les bras levés. Exercice HIIT par excellence.",
  },
  {
    name: "Box jump",
    name_en: "Box Jump",
    muscle_group: "Cardio",
    secondary_muscle: "Fessiers, Jambes",
    equipment: "Poids de corps",
    type: "compound",
    tracking_type: "reps_only",
    public_cible: "mixte",
    description: "Saute sur une boîte pliométrique et redescend en pas. Développe la puissance explosive des membres inférieurs.",
  },
  {
    name: "Sprint",
    name_en: "Sprint",
    muscle_group: "Cardio",
    secondary_muscle: "Fessiers, Ischio-jambiers",
    equipment: "Poids de corps",
    type: "cardio",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Course à vitesse maximale sur courte distance (20-100m). Développe la puissance anaérobie et la vitesse.",
  },
  {
    name: "Haussement d'épaules barre",
    name_en: "Barbell Shrug",
    muscle_group: "Trapèzes",
    secondary_muscle: null,
    equipment: "Barre",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Debout, barre en prise pronation, hausse les épaules le plus haut possible. Développe les trapèzes supérieurs.",
  },
  {
    name: "Haussement d'épaules haltères",
    name_en: "Dumbbell Shrug",
    muscle_group: "Trapèzes",
    secondary_muscle: null,
    equipment: "Haltères",
    type: "isolation",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Même mouvement qu'avec la barre mais avec haltères, permettant une rotation plus naturelle des épaules.",
  },
  {
    name: "Arraché haltère",
    name_en: "Dumbbell Snatch",
    muscle_group: "Full Body",
    secondary_muscle: "Fessiers, Épaules, Core",
    equipment: "Haltères",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Un haltère en main, monte-le en un seul mouvement explosif depuis le sol jusqu'à bras tendu au-dessus de la tête. Explosivité et coordination.",
  },
  {
    name: "Turkish get-up",
    name_en: "Turkish Get-Up",
    muscle_group: "Full Body",
    secondary_muscle: "Épaules, Core, Jambes",
    equipment: "Kettlebell",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Se lève du sol à debout avec un kettlebell bras tendu, puis revient. Améliore la mobilité, la stabilité et la force fonctionnelle.",
  },
  {
    name: "Thruster",
    name_en: "Thruster",
    muscle_group: "Full Body",
    secondary_muscle: "Jambes, Épaules, Core",
    equipment: "Haltères",
    type: "compound",
    tracking_type: "reps_weight",
    public_cible: "mixte",
    description: "Squat suivi d'un développé vertical en un seul mouvement fluide. Combine squat et press pour un exercice HIIT/force.",
  },
  {
    name: "Étirement mollets mur",
    name_en: "Standing Calf Stretch",
    muscle_group: "Mollets",
    secondary_muscle: null,
    equipment: "Poids de corps",
    type: "stretching",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Main contre un mur, talon posé au sol, genou tendu — pousse les hanches vers le mur. Étire le gastrocnémien.",
  },
  {
    name: "Étirement épaules bras croisé",
    name_en: "Cross-Body Shoulder Stretch",
    muscle_group: "Épaules",
    secondary_muscle: null,
    equipment: "Poids de corps",
    type: "stretching",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Passe un bras devant la poitrine, l'autre bras tire le coude vers l'épaule opposée. Étire le deltoïde postérieur.",
  },
  {
    name: "Étirement quadriceps debout",
    name_en: "Standing Quad Stretch",
    muscle_group: "Jambes",
    secondary_muscle: null,
    equipment: "Poids de corps",
    type: "stretching",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Debout, ramène un pied vers les fessiers en tenant la cheville. Étire les quadriceps et les fléchisseurs de hanche.",
  },
  {
    name: "Pigeon (yoga)",
    name_en: "Pigeon Pose",
    muscle_group: "Fessiers",
    secondary_muscle: "Fléchisseurs de hanche",
    equipment: "Poids de corps",
    type: "stretching",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Jambe avant fléchie à 90° devant soi, jambe arrière tendue derrière. Étirement profond du piriforme et des fessiers.",
  },
  {
    name: "Fente lézard (Lizard pose)",
    name_en: "Lizard Pose",
    muscle_group: "Fessiers",
    secondary_muscle: "Fléchisseurs de hanche, Adducteurs",
    equipment: "Poids de corps",
    type: "stretching",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Fente basse avec le pied du devant posé à l'extérieur de la main correspondante. Ouvre les hanches en profondeur.",
  },
  {
    name: "Étirement trapèzes",
    name_en: "Neck & Trap Stretch",
    muscle_group: "Trapèzes",
    secondary_muscle: null,
    equipment: "Poids de corps",
    type: "stretching",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Incline doucement la tête vers l'épaule et tire légèrement avec la main pour étirer le côté du cou et les trapèzes.",
  },
  {
    name: "Étirement biceps mur",
    name_en: "Wall Biceps Stretch",
    muscle_group: "Biceps",
    secondary_muscle: "Pectoraux",
    equipment: "Poids de corps",
    type: "stretching",
    tracking_type: "duration",
    public_cible: "mixte",
    description: "Pose la paume contre le mur à hauteur d'épaule, pivote le corps dans l'autre sens. Étire les biceps et l'avant de l'épaule.",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const dry_run: boolean = body.dry_run !== false; // default true
    const confirm: string | undefined = body.confirm;
    const categories: string[] | undefined = body.categories;

    if (!dry_run && confirm !== "AJOUTER_EXERCICES") {
      return new Response(
        JSON.stringify({ error: "confirm manquant ou invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Pre-fetch all default exercises for in-memory idempotence check
    const { data: existingDefaults, error: fetchErr } = await admin
      .from("exercises")
      .select("id, name, name_en")
      .eq("is_default", true);
    if (fetchErr) throw new Error(`fetch defaults: ${fetchErr.message}`);

    const existingSet = new Map<string, { id: string; name: string; name_en: string | null }>();
    for (const row of existingDefaults ?? []) {
      const keyName = (row.name ?? "").trim().toLowerCase();
      const keyNameEn = (row.name_en ?? "").trim().toLowerCase();
      if (keyName) existingSet.set(keyName, row);
      if (keyNameEn) existingSet.set(keyNameEn, row);
    }

    function alreadyExists(ex: ExerciseSeed): boolean {
      const n = ex.name.trim().toLowerCase();
      const nEn = ex.name_en.trim().toLowerCase();
      return existingSet.has(n) || existingSet.has(nEn);
    }

    // Filter by categories if provided
    let toProcess = NOUVEAUX_EXERCICES;
    if (categories && categories.length > 0) {
      const catSet = new Set(categories.map((c: string) => c.toLowerCase()));
      toProcess = NOUVEAUX_EXERCICES.filter((ex) => catSet.has(ex.muscle_group.toLowerCase()));
    }

    const aInserer: any[] = [];
    const dejaPresents: any[] = [];
    const parMuscleGroup: Record<string, number> = {};

    for (const ex of toProcess) {
      if (alreadyExists(ex)) {
        dejaPresents.push({
          name: ex.name,
          raison: "name ou name_en déjà en base",
        });
        continue;
      }

      if (dry_run) {
        aInserer.push({
          name: ex.name,
          name_en: ex.name_en,
          muscle_group: ex.muscle_group,
          equipment: ex.equipment,
          type: ex.type,
        });
        parMuscleGroup[ex.muscle_group] = (parMuscleGroup[ex.muscle_group] || 0) + 1;
      } else {
        const { data: inserted, error: insertErr } = await admin
          .from("exercises")
          .insert({
            name: ex.name,
            name_en: ex.name_en,
            muscle_group: ex.muscle_group,
            secondary_muscle: ex.secondary_muscle,
            equipment: ex.equipment,
            type: ex.type,
            tracking_type: ex.tracking_type,
            public_cible: ex.public_cible,
            description: ex.description,
            is_default: true,
            created_by: null,
          })
          .select("id");

        if (insertErr) throw new Error(`insert ${ex.name}: ${insertErr.message}`);

        aInserer.push({
          name: ex.name,
          id: inserted?.[0]?.id,
        });
        parMuscleGroup[ex.muscle_group] = (parMuscleGroup[ex.muscle_group] || 0) + 1;
      }
    }

    if (dry_run) {
      return new Response(
        JSON.stringify({
          mode: "DRY_RUN — aucune insertion",
          total_a_inserer: aInserer.length,
          total_deja_present: dejaPresents.length,
          a_inserer: aInserer,
          deja_present: dejaPresents,
          par_muscle_group: parMuscleGroup,
          next_step: "Relancer avec { dry_run: false, confirm: 'AJOUTER_EXERCICES' } pour insérer.",
        }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        applied: true,
        inserted: aInserer.length,
        skipped_already_present: dejaPresents.length,
        inserted_ids: aInserer.map((e) => e.id),
        par_muscle_group: parMuscleGroup,
        timestamp: new Date().toISOString(),
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
