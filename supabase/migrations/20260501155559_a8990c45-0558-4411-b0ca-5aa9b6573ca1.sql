-- =====================================================================
-- NUTRITION MODULE — PR1
-- Structured meal plans with food chips (replacing free-text foods)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) FOODS LIBRARY
-- ---------------------------------------------------------------------
CREATE TABLE public.foods (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr         text NOT NULL,
  name_en         text NOT NULL,
  category        text NOT NULL CHECK (category IN (
                    'protein','carb','fat','vegetable','fruit',
                    'dairy','beverage','supplement','other'
                  )),
  kcal_per_100g     numeric NOT NULL DEFAULT 0 CHECK (kcal_per_100g >= 0),
  protein_per_100g  numeric NOT NULL DEFAULT 0 CHECK (protein_per_100g >= 0),
  carbs_per_100g    numeric NOT NULL DEFAULT 0 CHECK (carbs_per_100g >= 0),
  fat_per_100g      numeric NOT NULL DEFAULT 0 CHECK (fat_per_100g >= 0),
  fiber_per_100g    numeric NULL CHECK (fiber_per_100g IS NULL OR fiber_per_100g >= 0),
  default_unit    text NOT NULL DEFAULT 'g' CHECK (default_unit IN (
                    'g','ml','piece','tbsp','tsp','cup'
                  )),
  is_system       boolean NOT NULL DEFAULT false,
  created_by      uuid NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- A custom food must have an owner; a system food must NOT.
  CONSTRAINT foods_ownership_chk CHECK (
    (is_system = true  AND created_by IS NULL) OR
    (is_system = false AND created_by IS NOT NULL)
  )
);

CREATE INDEX foods_created_by_idx ON public.foods(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX foods_category_idx   ON public.foods(category);
CREATE INDEX foods_search_idx     ON public.foods USING gin (
  to_tsvector('simple', coalesce(name_fr,'') || ' ' || coalesce(name_en,''))
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- Read: system foods are visible to everyone authenticated
CREATE POLICY "Anyone can view system foods"
ON public.foods FOR SELECT TO authenticated
USING (is_system = true);

-- Read: each user can see their own custom foods
CREATE POLICY "Users can view their own custom foods"
ON public.foods FOR SELECT TO authenticated
USING (auth.uid() = created_by);

-- Read: athletes can view their active coach's custom foods
CREATE POLICY "Athletes can view their coach custom foods"
ON public.foods FOR SELECT TO authenticated
USING (
  created_by IS NOT NULL AND created_by IN (
    SELECT cs.coach_id FROM public.coach_students cs
    WHERE cs.student_id = auth.uid() AND cs.status = 'active'
  )
);

-- Read: coaches can view their active athletes' custom foods
CREATE POLICY "Coaches can view their athletes custom foods"
ON public.foods FOR SELECT TO authenticated
USING (
  created_by IS NOT NULL AND created_by IN (
    SELECT cs.student_id FROM public.coach_students cs
    WHERE cs.coach_id = auth.uid() AND cs.status = 'active'
  )
);

-- Write: anyone can create their own custom food
CREATE POLICY "Users can create their custom foods"
ON public.foods FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can update their custom foods"
ON public.foods FOR UPDATE TO authenticated
USING (created_by = auth.uid() AND is_system = false)
WITH CHECK (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete their custom foods"
ON public.foods FOR DELETE TO authenticated
USING (created_by = auth.uid() AND is_system = false);

CREATE TRIGGER foods_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 2) MEAL PLANS (one active plan per athlete)
-- ---------------------------------------------------------------------
CREATE TABLE public.meal_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL,
  coach_id            uuid NULL,
  name                text NOT NULL DEFAULT 'Plan nutritionnel',
  notes               text NULL,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  athlete_can_edit    boolean NOT NULL DEFAULT false,
  -- Daily targets snapshot at plan level (optional, fall back to nutrition_profiles)
  target_kcal         integer NULL,
  target_protein_g    integer NULL,
  target_carbs_g      integer NULL,
  target_fat_g        integer NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Enforce a single ACTIVE plan per athlete (archived ones can coexist).
CREATE UNIQUE INDEX meal_plans_one_active_per_student
  ON public.meal_plans(student_id) WHERE status = 'active';

CREATE INDEX meal_plans_student_idx ON public.meal_plans(student_id);
CREATE INDEX meal_plans_coach_idx   ON public.meal_plans(coach_id) WHERE coach_id IS NOT NULL;

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Athletes can always read their plans
CREATE POLICY "Athletes can read their own plans"
ON public.meal_plans FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- Coaches can read plans for their active athletes
CREATE POLICY "Coaches can read their athletes plans"
ON public.meal_plans FOR SELECT TO authenticated
USING (
  coach_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.coach_students cs
    WHERE cs.coach_id = auth.uid()
      AND cs.student_id = meal_plans.student_id
      AND cs.status = 'active'
  )
);

-- Coaches can create plans for their active athletes
CREATE POLICY "Coaches can create plans for their athletes"
ON public.meal_plans FOR INSERT TO authenticated
WITH CHECK (
  coach_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.coach_students cs
    WHERE cs.coach_id = auth.uid()
      AND cs.student_id = meal_plans.student_id
      AND cs.status = 'active'
  )
);

-- Self-guided athletes (no coach) can create their own plan
CREATE POLICY "Athletes can create their self-guided plan"
ON public.meal_plans FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid() AND coach_id IS NULL);

-- Coaches can update plans they created
CREATE POLICY "Coaches can update their plans"
ON public.meal_plans FOR UPDATE TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Athletes can update their plan if allowed (or self-guided)
CREATE POLICY "Athletes can update editable plans"
ON public.meal_plans FOR UPDATE TO authenticated
USING (
  student_id = auth.uid() AND (athlete_can_edit = true OR coach_id IS NULL)
)
WITH CHECK (
  student_id = auth.uid() AND (athlete_can_edit = true OR coach_id IS NULL)
);

-- Coaches can delete plans they created
CREATE POLICY "Coaches can delete their plans"
ON public.meal_plans FOR DELETE TO authenticated
USING (coach_id = auth.uid());

-- Self-guided athletes can delete their own plan
CREATE POLICY "Athletes can delete their self-guided plan"
ON public.meal_plans FOR DELETE TO authenticated
USING (student_id = auth.uid() AND coach_id IS NULL);

CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 3) MEALS (cards within a plan)
-- ---------------------------------------------------------------------
CREATE TABLE public.meals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       uuid NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  name          text NOT NULL,
  time_target   text NULL,           -- "08:00", free format to stay flexible
  order_index   integer NOT NULL DEFAULT 0,
  notes         text NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX meals_plan_idx ON public.meals(plan_id, order_index);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Helper: a meal is accessible if its parent plan is.
-- We re-implement plan visibility checks here to avoid recursive policy lookups.
CREATE POLICY "Meals readable when plan is readable"
ON public.meals FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.meal_plans p
  WHERE p.id = meals.plan_id
    AND (
      p.student_id = auth.uid()
      OR p.coach_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.coach_students cs
        WHERE cs.coach_id = auth.uid() AND cs.student_id = p.student_id AND cs.status = 'active'
      )
    )
));

CREATE POLICY "Meals writable by plan editors"
ON public.meals FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.meal_plans p
  WHERE p.id = meals.plan_id
    AND (
      p.coach_id = auth.uid()
      OR (p.student_id = auth.uid() AND (p.athlete_can_edit = true OR p.coach_id IS NULL))
    )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.meal_plans p
  WHERE p.id = meals.plan_id
    AND (
      p.coach_id = auth.uid()
      OR (p.student_id = auth.uid() AND (p.athlete_can_edit = true OR p.coach_id IS NULL))
    )
));

CREATE TRIGGER meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 4) MEAL_FOODS (chips within a meal)
-- ---------------------------------------------------------------------
CREATE TABLE public.meal_foods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     uuid NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id     uuid NOT NULL REFERENCES public.foods(id) ON DELETE RESTRICT,
  quantity    numeric NOT NULL DEFAULT 100 CHECK (quantity > 0),
  unit        text NOT NULL DEFAULT 'g' CHECK (unit IN (
                'g','ml','piece','tbsp','tsp','cup'
              )),
  order_index integer NOT NULL DEFAULT 0,
  notes       text NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX meal_foods_meal_idx ON public.meal_foods(meal_id, order_index);
CREATE INDEX meal_foods_food_idx ON public.meal_foods(food_id);

ALTER TABLE public.meal_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meal foods readable when meal is readable"
ON public.meal_foods FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.meals m
  JOIN public.meal_plans p ON p.id = m.plan_id
  WHERE m.id = meal_foods.meal_id
    AND (
      p.student_id = auth.uid()
      OR p.coach_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.coach_students cs
        WHERE cs.coach_id = auth.uid() AND cs.student_id = p.student_id AND cs.status = 'active'
      )
    )
));

CREATE POLICY "Meal foods writable by plan editors"
ON public.meal_foods FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.meals m
  JOIN public.meal_plans p ON p.id = m.plan_id
  WHERE m.id = meal_foods.meal_id
    AND (
      p.coach_id = auth.uid()
      OR (p.student_id = auth.uid() AND (p.athlete_can_edit = true OR p.coach_id IS NULL))
    )
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.meals m
  JOIN public.meal_plans p ON p.id = m.plan_id
  WHERE m.id = meal_foods.meal_id
    AND (
      p.coach_id = auth.uid()
      OR (p.student_id = auth.uid() AND (p.athlete_can_edit = true OR p.coach_id IS NULL))
    )
));

-- ---------------------------------------------------------------------
-- 5) Realtime (optional — useful for coach watching live edits)
-- ---------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_foods;

-- ---------------------------------------------------------------------
-- 6) SEED — ~25 base foods (FR/EN, CIQUAL/USDA-aligned macros)
-- ---------------------------------------------------------------------
INSERT INTO public.foods
  (name_fr, name_en, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, default_unit, is_system)
VALUES
  -- Protein
  ('Blanc de poulet',        'Chicken breast',     'protein',   165, 31.0,  0.0,  3.6, 0,    'g', true),
  ('Œuf entier',              'Whole egg',          'protein',   155, 13.0,  1.1, 11.0, 0,    'piece', true),
  ('Blanc d''œuf',            'Egg white',          'protein',    52, 11.0,  0.7,  0.2, 0,    'piece', true),
  ('Saumon',                  'Salmon',             'protein',   208, 20.0,  0.0, 13.0, 0,    'g', true),
  ('Thon (au naturel)',       'Tuna (in water)',    'protein',   116, 26.0,  0.0,  1.0, 0,    'g', true),
  ('Steak haché 5 % MG',      'Lean ground beef',   'protein',   137, 21.0,  0.0,  5.0, 0,    'g', true),
  ('Tofu nature',             'Plain tofu',         'protein',    76,  8.0,  1.9,  4.8, 0.3,  'g', true),
  ('Whey protéine',           'Whey protein',       'supplement',400, 80.0,  7.0,  6.0, 0,    'g', true),
  -- Carbs
  ('Riz blanc cuit',          'White rice (cooked)','carb',      130,  2.7, 28.0,  0.3, 0.4,  'g', true),
  ('Riz complet cuit',        'Brown rice (cooked)','carb',      111,  2.6, 23.0,  0.9, 1.8,  'g', true),
  ('Pâtes cuites',            'Pasta (cooked)',     'carb',      131,  5.0, 25.0,  1.1, 1.8,  'g', true),
  ('Patate douce cuite',      'Sweet potato (cooked)','carb',     90,  2.0, 21.0,  0.1, 3.3,  'g', true),
  ('Pomme de terre cuite',    'Potato (cooked)',    'carb',       87,  1.9, 20.0,  0.1, 1.8,  'g', true),
  ('Flocons d''avoine',       'Rolled oats',        'carb',      379, 13.0, 67.0,  7.0, 10.0, 'g', true),
  ('Pain complet',            'Whole grain bread',  'carb',      247, 13.0, 41.0,  3.4, 7.0,  'g', true),
  -- Fat
  ('Huile d''olive',          'Olive oil',          'fat',       884,  0.0,  0.0,100.0, 0,    'tbsp', true),
  ('Amandes',                 'Almonds',            'fat',       579, 21.0, 22.0, 50.0, 12.5, 'g', true),
  ('Avocat',                  'Avocado',            'fat',       160,  2.0,  9.0, 15.0, 7.0,  'piece', true),
  ('Beurre de cacahuète',     'Peanut butter',      'fat',       588, 25.0, 20.0, 50.0, 6.0,  'tbsp', true),
  -- Vegetable / Fruit
  ('Brocoli cuit',            'Broccoli (cooked)',  'vegetable',  35,  2.4,  7.0,  0.4, 3.3,  'g', true),
  ('Épinards',                'Spinach',            'vegetable',  23,  2.9,  3.6,  0.4, 2.2,  'g', true),
  ('Banane',                  'Banana',             'fruit',      89,  1.1, 23.0,  0.3, 2.6,  'piece', true),
  ('Pomme',                   'Apple',              'fruit',      52,  0.3, 14.0,  0.2, 2.4,  'piece', true),
  -- Dairy
  ('Fromage blanc 0 %',       'Quark 0 %',          'dairy',       55, 10.0,  4.0,  0.2, 0,    'g', true),
  ('Yaourt grec 0 %',         'Greek yogurt 0 %',   'dairy',       59, 10.0,  3.6,  0.4, 0,    'g', true),
  ('Lait demi-écrémé',        'Semi-skim milk',     'dairy',       46,  3.3,  4.8,  1.6, 0,    'ml', true),
  -- Beverage
  ('Eau',                     'Water',              'beverage',     0,  0.0,  0.0,  0.0, 0,    'ml', true),
  ('Café noir',               'Black coffee',       'beverage',     1,  0.1,  0.0,  0.0, 0,    'ml', true);
