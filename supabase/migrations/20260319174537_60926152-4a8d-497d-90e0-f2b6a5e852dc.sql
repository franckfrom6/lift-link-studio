
-- Step 1: Drop the restrictive CHECK constraint on type
ALTER TABLE public.exercises DROP CONSTRAINT exercises_type_check;

-- Step 2: Re-add with all valid types
ALTER TABLE public.exercises ADD CONSTRAINT exercises_type_check 
  CHECK (type = ANY (ARRAY['compound','isolation','warmup','stretching','cardio']));

-- Step 3: Insert warmup/stretching exercises
INSERT INTO public.exercises (name, name_en, muscle_group, equipment, type, tracking_type, is_default, created_by, public_cible, secondary_muscle, description)
SELECT v.name, v.name_en, v.muscle_group, v.equipment, v.type, v.tracking_type, true, NULL, v.public_cible, v.secondary_muscle, v.description
FROM (VALUES
  ('Rotation des hanches','Hip Circles','Jambes','Aucun','warmup','duration','mixte','Fessiers','Cercles de hanches debout. Mobilisation articulaire des hanches.'),
  ('Rotation des épaules','Shoulder Circles','Épaules','Aucun','warmup','duration','mixte','Trapèzes','Cercles d épaules bras tendus. Échauffement articulaire du complexe de l épaule.'),
  ('Cat-cow','Cat-Cow Stretch','Dos','Aucun','warmup','duration','mixte','Abdominaux','Flexion-extension du rachis à quatre pattes. Mobilisation vertébrale douce.'),
  ('Inchworm','Inchworm','Full Body','Aucun','warmup','duration','mixte','Épaules, Jambes','Marche des mains depuis debout jusqu en planche et retour. Échauffement global.'),
  ('Scorpion stretch','Scorpion Stretch','Dos','Aucun','warmup','duration','mixte','Épaules','Rotation thoracique au sol en position ventrale. Mobilité du haut du dos.'),
  ('World greatest stretch','World Greatest Stretch','Full Body','Aucun','warmup','duration','mixte','Jambes, Épaules','Enchaînement fente + rotation thoracique + extension hanche. Échauffement complet.'),
  ('Jumping jacks','Jumping Jacks','Full Body','Aucun','warmup','duration','mixte',NULL,'Jumping jacks classiques. Élévation du rythme cardiaque en échauffement.'),
  ('High knees','High Knees','Full Body','Aucun','warmup','duration','mixte','Abdominaux','Montées de genoux dynamiques sur place. Échauffement cardio.'),
  ('Étirement psoas fente basse','Low Lunge Hip Flexor Stretch','Jambes','Aucun','stretching','duration','mixte','Fessiers','Étirement du psoas en fente basse au sol. Essentiel après la position assise prolongée.'),
  ('Étirement piriforme','Piriformis Stretch','Fessiers','Aucun','stretching','duration','mixte',NULL,'Étirement du piriforme en figure 4. Soulage les tensions de la hanche et du bas du dos.'),
  ('Étirement pectoraux mur','Wall Chest Stretch','Pectoraux','Aucun','stretching','duration','mixte','Épaules','Étirement des pectoraux contre un mur ou encadrement de porte.'),
  ('Étirement dorsaux','Lat Stretch','Dos','Aucun','stretching','duration','mixte',NULL,'Étirement du grand dorsal bras en hauteur contre un support.'),
  ('Étirement quadriceps debout','Standing Quad Stretch','Jambes','Aucun','stretching','duration','mixte',NULL,'Étirement classique des quadriceps debout en ramenant le talon aux fesses.'),
  ('Étirement ischio-jambiers','Hamstring Stretch','Jambes','Aucun','stretching','duration','mixte',NULL,'Étirement des ischio-jambiers jambe tendue sur un support.'),
  ('Clamshell','Clamshell','Fessiers','Élastique','warmup','reps_only','mixte',NULL,'Ouverture des genoux couché sur le côté avec élastique. Activation du moyen fessier.'),
  ('Banded monster walk','Banded Monster Walk','Fessiers','Élastique','warmup','reps_only','mixte','Jambes','Marche latérale avec élastique aux chevilles. Activation fessiers.'),
  ('Band pull-apart','Band Pull Apart','Épaules','Élastique','warmup','reps_only','mixte','Dos, Trapèzes','Écartement d élastique devant soi. Activation du deltoïde postérieur et rétracteurs de la scapula.'),
  ('Wall slide','Wall Slides','Épaules','Aucun','warmup','reps_only','mixte','Trapèzes','Glissement des bras contre un mur en Y. Améliore la mobilité et la stabilité scapulaire.')
) AS v(name, name_en, muscle_group, equipment, type, tracking_type, public_cible, secondary_muscle, description)
WHERE NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.name = v.name);
