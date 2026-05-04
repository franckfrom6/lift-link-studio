-- Deduplicate non-snack/water meal entries: keep most recent per (student, date, meal_type)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY student_id, date, meal_type ORDER BY created_at DESC, id DESC) AS rn
  FROM public.daily_nutrition_logs
  WHERE meal_type NOT IN ('snack','water')
)
DELETE FROM public.daily_nutrition_logs
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Prevent future duplicates (snack and water can repeat)
CREATE UNIQUE INDEX IF NOT EXISTS daily_nutrition_logs_unique_meal_per_day
ON public.daily_nutrition_logs (student_id, date, meal_type)
WHERE meal_type NOT IN ('snack','water');