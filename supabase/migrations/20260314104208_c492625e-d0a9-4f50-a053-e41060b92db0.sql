-- Migrate muscle_group values from French to English
UPDATE public.exercises SET muscle_group = CASE muscle_group
  WHEN 'Pectoraux' THEN 'chest'
  WHEN 'Dos' THEN 'back'
  WHEN 'Épaules' THEN 'shoulders'
  WHEN 'Bras' THEN 'arms'
  WHEN 'Jambes' THEN 'legs'
  WHEN 'Fessiers' THEN 'glutes'
  WHEN 'Abdos' THEN 'abs'
  ELSE muscle_group
END
WHERE muscle_group IN ('Pectoraux', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Fessiers', 'Abdos');

-- Migrate secondary_muscle values from French to English
UPDATE public.exercises SET secondary_muscle = CASE secondary_muscle
  WHEN 'Pectoraux' THEN 'chest'
  WHEN 'Dos' THEN 'back'
  WHEN 'Épaules' THEN 'shoulders'
  WHEN 'Bras' THEN 'arms'
  WHEN 'Jambes' THEN 'legs'
  WHEN 'Fessiers' THEN 'glutes'
  WHEN 'Abdos' THEN 'abs'
  ELSE secondary_muscle
END
WHERE secondary_muscle IN ('Pectoraux', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Fessiers', 'Abdos');

-- Migrate equipment values from French to English
UPDATE public.exercises SET equipment = CASE equipment
  WHEN 'Barre' THEN 'barbell'
  WHEN 'Haltères' THEN 'dumbbells'
  WHEN 'Machine' THEN 'machine'
  WHEN 'Câble' THEN 'cable'
  WHEN 'Poids du corps' THEN 'bodyweight'
  ELSE equipment
END
WHERE equipment IN ('Barre', 'Haltères', 'Machine', 'Câble', 'Poids du corps');