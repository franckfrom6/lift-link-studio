-- =====================================================================
-- 1) REALTIME — add nutrition tables to publication
-- =====================================================================
DO $$
BEGIN
  -- Use IF EXISTS to stay idempotent across reruns.
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='meal_plans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_plans;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='meals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meals;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='meal_foods'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_foods;
  END IF;
END $$;

ALTER TABLE public.meal_plans REPLICA IDENTITY FULL;
ALTER TABLE public.meals REPLICA IDENTITY FULL;
ALTER TABLE public.meal_foods REPLICA IDENTITY FULL;

-- =====================================================================
-- 2) Athlete change requests
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.meal_plan_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  student_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending', -- pending | acknowledged | resolved
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mpcr_coach_idx ON public.meal_plan_change_requests(coach_id, status);
CREATE INDEX IF NOT EXISTS mpcr_student_idx ON public.meal_plan_change_requests(student_id);

ALTER TABLE public.meal_plan_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes create their change requests" ON public.meal_plan_change_requests;
CREATE POLICY "Athletes create their change requests"
ON public.meal_plan_change_requests
FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Athletes view their change requests" ON public.meal_plan_change_requests;
CREATE POLICY "Athletes view their change requests"
ON public.meal_plan_change_requests
FOR SELECT TO authenticated
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Coaches view their change requests" ON public.meal_plan_change_requests;
CREATE POLICY "Coaches view their change requests"
ON public.meal_plan_change_requests
FOR SELECT TO authenticated
USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches update their change requests" ON public.meal_plan_change_requests;
CREATE POLICY "Coaches update their change requests"
ON public.meal_plan_change_requests
FOR UPDATE TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

DROP TRIGGER IF EXISTS update_mpcr_updated_at ON public.meal_plan_change_requests;
CREATE TRIGGER update_mpcr_updated_at
BEFORE UPDATE ON public.meal_plan_change_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- 3) Idempotent uniqueness for system seed (so re-runs don't duplicate)
-- =====================================================================
CREATE UNIQUE INDEX IF NOT EXISTS foods_system_unique_name
  ON public.foods (lower(name_fr), category)
  WHERE is_system = true;

-- =====================================================================
-- 4) SEED foods (~150 system items, FR + EN, CIQUAL-inspired)
--    INSERT … ON CONFLICT DO NOTHING via the partial unique index.
-- =====================================================================
INSERT INTO public.foods
  (name_fr, name_en, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, default_unit, is_system, created_by)
VALUES
  -- ---- PROTEIN ----
  ('Blanc de poulet', 'Chicken breast', 'protein', 121, 26, 0, 1.5, 0, 'g', true, NULL),
  ('Cuisse de poulet', 'Chicken thigh', 'protein', 177, 24, 0, 8.6, 0, 'g', true, NULL),
  ('Dinde escalope', 'Turkey escalope', 'protein', 109, 24, 0, 1.2, 0, 'g', true, NULL),
  ('Bœuf haché 5%', 'Lean ground beef 5%', 'protein', 137, 21, 0, 5.5, 0, 'g', true, NULL),
  ('Bœuf haché 15%', 'Ground beef 15%', 'protein', 220, 19, 0, 15, 0, 'g', true, NULL),
  ('Steak haché 10%', 'Beef steak 10%', 'protein', 188, 20, 0, 10, 0, 'g', true, NULL),
  ('Filet mignon de porc', 'Pork tenderloin', 'protein', 134, 22, 0, 4.5, 0, 'g', true, NULL),
  ('Jambon blanc', 'Cooked ham', 'protein', 113, 21, 0.5, 3, 0, 'g', true, NULL),
  ('Jambon de dinde', 'Turkey ham', 'protein', 110, 22, 0.5, 2, 0, 'g', true, NULL),
  ('Saumon frais', 'Fresh salmon', 'protein', 208, 20, 0, 13, 0, 'g', true, NULL),
  ('Saumon fumé', 'Smoked salmon', 'protein', 182, 23, 0, 9, 0, 'g', true, NULL),
  ('Thon naturel', 'Tuna in water', 'protein', 116, 26, 0, 1, 0, 'g', true, NULL),
  ('Thon huile olive', 'Tuna in olive oil', 'protein', 189, 25, 0, 9, 0, 'g', true, NULL),
  ('Cabillaud', 'Cod', 'protein', 82, 18, 0, 0.7, 0, 'g', true, NULL),
  ('Lieu noir', 'Pollock', 'protein', 85, 19, 0, 0.9, 0, 'g', true, NULL),
  ('Sardines à l''huile', 'Sardines in oil', 'protein', 220, 24, 0, 13, 0, 'g', true, NULL),
  ('Maquereau', 'Mackerel', 'protein', 200, 19, 0, 14, 0, 'g', true, NULL),
  ('Crevettes cuites', 'Cooked shrimp', 'protein', 99, 20, 0.2, 1.7, 0, 'g', true, NULL),
  ('Œuf entier', 'Whole egg', 'protein', 145, 12.7, 0.7, 9.8, 0, 'piece', true, NULL),
  ('Blanc d''œuf', 'Egg white', 'protein', 47, 10.9, 0.7, 0.2, 0, 'g', true, NULL),
  ('Tofu nature', 'Tofu', 'protein', 116, 12, 1.2, 7, 0.3, 'g', true, NULL),
  ('Tempeh', 'Tempeh', 'protein', 192, 20, 8, 11, 5, 'g', true, NULL),
  ('Seitan', 'Seitan', 'protein', 145, 25, 14, 1.9, 1, 'g', true, NULL),
  ('Whey isolate', 'Whey isolate', 'supplement', 380, 88, 4, 1, 0, 'g', true, NULL),
  ('Whey concentrée', 'Whey concentrate', 'supplement', 400, 75, 8, 6, 0, 'g', true, NULL),
  ('Caséine', 'Casein', 'supplement', 360, 80, 5, 1.5, 0, 'g', true, NULL),
  ('Protéine végétale', 'Plant protein blend', 'supplement', 380, 75, 7, 4, 4, 'g', true, NULL),
  ('Lentilles cuites', 'Cooked lentils', 'protein', 116, 9, 20, 0.4, 8, 'g', true, NULL),
  ('Pois chiches cuits', 'Cooked chickpeas', 'protein', 164, 8.9, 27, 2.6, 7.6, 'g', true, NULL),
  ('Haricots rouges cuits', 'Cooked kidney beans', 'protein', 127, 8.7, 23, 0.5, 6.4, 'g', true, NULL),
  ('Haricots blancs cuits', 'Cooked white beans', 'protein', 139, 9.7, 25, 0.6, 6.3, 'g', true, NULL),
  ('Edamame', 'Edamame', 'protein', 122, 11, 8, 5, 5, 'g', true, NULL),

  -- ---- CARB ----
  ('Riz blanc cuit', 'White rice cooked', 'carb', 130, 2.7, 28, 0.3, 0.4, 'g', true, NULL),
  ('Riz basmati cuit', 'Basmati rice cooked', 'carb', 121, 3, 25, 0.4, 0.6, 'g', true, NULL),
  ('Riz complet cuit', 'Brown rice cooked', 'carb', 123, 2.7, 25, 1, 1.6, 'g', true, NULL),
  ('Pâtes blanches cuites', 'White pasta cooked', 'carb', 158, 5.8, 31, 0.9, 1.8, 'g', true, NULL),
  ('Pâtes complètes cuites', 'Whole wheat pasta cooked', 'carb', 149, 6, 28, 1.4, 4.5, 'g', true, NULL),
  ('Quinoa cuit', 'Cooked quinoa', 'carb', 120, 4.4, 21, 1.9, 2.8, 'g', true, NULL),
  ('Boulgour cuit', 'Cooked bulgur', 'carb', 83, 3, 19, 0.2, 4.5, 'g', true, NULL),
  ('Couscous cuit', 'Cooked couscous', 'carb', 112, 3.8, 23, 0.2, 1.4, 'g', true, NULL),
  ('Pomme de terre cuite', 'Boiled potato', 'carb', 87, 1.9, 20, 0.1, 1.8, 'g', true, NULL),
  ('Patate douce cuite', 'Cooked sweet potato', 'carb', 90, 2, 21, 0.2, 3.3, 'g', true, NULL),
  ('Pain blanc', 'White bread', 'carb', 265, 9, 49, 3.2, 2.7, 'g', true, NULL),
  ('Pain complet', 'Whole wheat bread', 'carb', 247, 13, 41, 3.5, 7, 'g', true, NULL),
  ('Pain de seigle', 'Rye bread', 'carb', 259, 8.5, 48, 3.3, 5.8, 'g', true, NULL),
  ('Baguette tradition', 'Baguette', 'carb', 274, 9, 55, 1.5, 2.4, 'g', true, NULL),
  ('Wrap blé', 'Wheat wrap', 'carb', 290, 8, 48, 7, 3, 'g', true, NULL),
  ('Tortilla maïs', 'Corn tortilla', 'carb', 218, 5.7, 45, 2.9, 6.3, 'g', true, NULL),
  ('Flocons d''avoine', 'Rolled oats', 'carb', 379, 13, 60, 8.5, 10, 'g', true, NULL),
  ('Muesli sans sucre', 'Unsweetened muesli', 'carb', 367, 11, 60, 7.5, 9, 'g', true, NULL),
  ('Granola maison', 'Homemade granola', 'carb', 470, 11, 64, 18, 7, 'g', true, NULL),
  ('Galette de riz', 'Rice cake', 'carb', 388, 8, 82, 3, 2.4, 'piece', true, NULL),
  ('Cracottes', 'Crispbread', 'carb', 386, 11, 76, 3, 6, 'piece', true, NULL),
  ('Polenta cuite', 'Cooked polenta', 'carb', 70, 1.5, 15, 0.3, 0.8, 'g', true, NULL),
  ('Sarrasin cuit', 'Cooked buckwheat', 'carb', 92, 3.4, 19, 0.6, 2.7, 'g', true, NULL),

  -- ---- FAT ----
  ('Huile d''olive', 'Olive oil', 'fat', 884, 0, 0, 100, 0, 'tbsp', true, NULL),
  ('Huile de colza', 'Canola oil', 'fat', 884, 0, 0, 100, 0, 'tbsp', true, NULL),
  ('Huile de coco', 'Coconut oil', 'fat', 892, 0, 0, 99, 0, 'tbsp', true, NULL),
  ('Huile de noix', 'Walnut oil', 'fat', 884, 0, 0, 100, 0, 'tbsp', true, NULL),
  ('Beurre doux', 'Unsalted butter', 'fat', 717, 0.6, 0.6, 81, 0, 'g', true, NULL),
  ('Margarine', 'Margarine', 'fat', 540, 0.4, 0.6, 60, 0, 'g', true, NULL),
  ('Avocat', 'Avocado', 'fat', 160, 2, 9, 15, 6.7, 'g', true, NULL),
  ('Amandes', 'Almonds', 'fat', 579, 21, 22, 50, 12.5, 'g', true, NULL),
  ('Noix', 'Walnuts', 'fat', 654, 15, 14, 65, 6.7, 'g', true, NULL),
  ('Noix de cajou', 'Cashews', 'fat', 553, 18, 30, 44, 3.3, 'g', true, NULL),
  ('Noisettes', 'Hazelnuts', 'fat', 628, 15, 17, 61, 9.7, 'g', true, NULL),
  ('Pistaches', 'Pistachios', 'fat', 562, 20, 28, 45, 10, 'g', true, NULL),
  ('Cacahuètes', 'Peanuts', 'fat', 567, 26, 16, 49, 8.5, 'g', true, NULL),
  ('Beurre de cacahuète', 'Peanut butter', 'fat', 588, 25, 20, 50, 6, 'tbsp', true, NULL),
  ('Beurre d''amande', 'Almond butter', 'fat', 614, 21, 19, 56, 10, 'tbsp', true, NULL),
  ('Graines de chia', 'Chia seeds', 'fat', 486, 17, 42, 31, 34, 'tbsp', true, NULL),
  ('Graines de lin', 'Flax seeds', 'fat', 534, 18, 29, 42, 27, 'tbsp', true, NULL),
  ('Graines de courge', 'Pumpkin seeds', 'fat', 559, 30, 11, 49, 6, 'g', true, NULL),
  ('Graines de tournesol', 'Sunflower seeds', 'fat', 584, 21, 20, 51, 8.6, 'g', true, NULL),
  ('Olives noires', 'Black olives', 'fat', 115, 0.8, 6, 11, 3.2, 'g', true, NULL),
  ('Olives vertes', 'Green olives', 'fat', 145, 1, 4, 15, 3, 'g', true, NULL),

  -- ---- VEGETABLE ----
  ('Brocoli cuit', 'Cooked broccoli', 'vegetable', 35, 2.4, 7, 0.4, 3.3, 'g', true, NULL),
  ('Chou-fleur cuit', 'Cooked cauliflower', 'vegetable', 23, 1.8, 4, 0.5, 2.3, 'g', true, NULL),
  ('Courgette cuite', 'Cooked zucchini', 'vegetable', 17, 1.2, 3, 0.3, 1.1, 'g', true, NULL),
  ('Carottes cuites', 'Cooked carrots', 'vegetable', 35, 0.8, 8, 0.2, 3, 'g', true, NULL),
  ('Carottes crues', 'Raw carrots', 'vegetable', 41, 0.9, 9.6, 0.2, 2.8, 'g', true, NULL),
  ('Épinards cuits', 'Cooked spinach', 'vegetable', 23, 3, 3.8, 0.3, 2.4, 'g', true, NULL),
  ('Salade verte', 'Green salad', 'vegetable', 15, 1.4, 2.9, 0.2, 1.3, 'g', true, NULL),
  ('Tomate', 'Tomato', 'vegetable', 18, 0.9, 3.9, 0.2, 1.2, 'g', true, NULL),
  ('Tomate cerise', 'Cherry tomato', 'vegetable', 18, 0.9, 3.9, 0.2, 1.2, 'g', true, NULL),
  ('Concombre', 'Cucumber', 'vegetable', 16, 0.7, 3.6, 0.1, 0.5, 'g', true, NULL),
  ('Poivron rouge', 'Red bell pepper', 'vegetable', 31, 1, 6, 0.3, 2.1, 'g', true, NULL),
  ('Poivron vert', 'Green bell pepper', 'vegetable', 20, 0.9, 4.6, 0.2, 1.7, 'g', true, NULL),
  ('Aubergine cuite', 'Cooked eggplant', 'vegetable', 35, 0.8, 8.7, 0.2, 2.5, 'g', true, NULL),
  ('Champignons cuits', 'Cooked mushrooms', 'vegetable', 28, 2.2, 5, 0.5, 2.2, 'g', true, NULL),
  ('Haricots verts cuits', 'Cooked green beans', 'vegetable', 35, 1.8, 7.9, 0.3, 3.4, 'g', true, NULL),
  ('Petits pois cuits', 'Cooked peas', 'vegetable', 84, 5.4, 16, 0.4, 5.5, 'g', true, NULL),
  ('Maïs cuit', 'Cooked corn', 'vegetable', 96, 3.4, 21, 1.5, 2.4, 'g', true, NULL),
  ('Asperges cuites', 'Cooked asparagus', 'vegetable', 22, 2.4, 4.1, 0.2, 2, 'g', true, NULL),
  ('Chou kale', 'Kale', 'vegetable', 49, 4.3, 8.8, 0.9, 3.6, 'g', true, NULL),
  ('Roquette', 'Rocket', 'vegetable', 25, 2.6, 3.7, 0.7, 1.6, 'g', true, NULL),
  ('Betterave cuite', 'Cooked beet', 'vegetable', 44, 1.7, 10, 0.2, 2, 'g', true, NULL),
  ('Oignon cru', 'Raw onion', 'vegetable', 40, 1.1, 9.3, 0.1, 1.7, 'g', true, NULL),
  ('Ail', 'Garlic', 'vegetable', 149, 6.4, 33, 0.5, 2.1, 'g', true, NULL),

  -- ---- FRUIT ----
  ('Pomme', 'Apple', 'fruit', 52, 0.3, 14, 0.2, 2.4, 'piece', true, NULL),
  ('Banane', 'Banana', 'fruit', 89, 1.1, 23, 0.3, 2.6, 'piece', true, NULL),
  ('Orange', 'Orange', 'fruit', 47, 0.9, 12, 0.1, 2.4, 'piece', true, NULL),
  ('Clémentine', 'Clementine', 'fruit', 47, 0.9, 12, 0.2, 1.7, 'piece', true, NULL),
  ('Poire', 'Pear', 'fruit', 57, 0.4, 15, 0.1, 3.1, 'piece', true, NULL),
  ('Pêche', 'Peach', 'fruit', 39, 0.9, 9.5, 0.3, 1.5, 'piece', true, NULL),
  ('Kiwi', 'Kiwi', 'fruit', 61, 1.1, 15, 0.5, 3, 'piece', true, NULL),
  ('Fraise', 'Strawberry', 'fruit', 32, 0.7, 7.7, 0.3, 2, 'g', true, NULL),
  ('Framboise', 'Raspberry', 'fruit', 52, 1.2, 12, 0.7, 6.5, 'g', true, NULL),
  ('Myrtille', 'Blueberry', 'fruit', 57, 0.7, 14, 0.3, 2.4, 'g', true, NULL),
  ('Cerise', 'Cherry', 'fruit', 63, 1.1, 16, 0.2, 2.1, 'g', true, NULL),
  ('Raisin', 'Grapes', 'fruit', 69, 0.7, 18, 0.2, 0.9, 'g', true, NULL),
  ('Ananas', 'Pineapple', 'fruit', 50, 0.5, 13, 0.1, 1.4, 'g', true, NULL),
  ('Mangue', 'Mango', 'fruit', 60, 0.8, 15, 0.4, 1.6, 'g', true, NULL),
  ('Melon', 'Melon', 'fruit', 34, 0.8, 8.2, 0.2, 0.9, 'g', true, NULL),
  ('Pastèque', 'Watermelon', 'fruit', 30, 0.6, 7.6, 0.2, 0.4, 'g', true, NULL),
  ('Avocat (fruit)', 'Avocado fruit', 'fruit', 160, 2, 9, 15, 6.7, 'piece', true, NULL),
  ('Citron', 'Lemon', 'fruit', 29, 1.1, 9, 0.3, 2.8, 'piece', true, NULL),
  ('Datte', 'Date', 'fruit', 282, 2.5, 75, 0.4, 8, 'piece', true, NULL),
  ('Figue séchée', 'Dried fig', 'fruit', 249, 3.3, 64, 0.9, 9.8, 'piece', true, NULL),
  ('Abricot sec', 'Dried apricot', 'fruit', 241, 3.4, 63, 0.5, 7.3, 'piece', true, NULL),
  ('Raisin sec', 'Raisins', 'fruit', 299, 3.1, 79, 0.5, 3.7, 'g', true, NULL),

  -- ---- DAIRY ----
  ('Lait demi-écrémé', 'Semi-skimmed milk', 'dairy', 47, 3.3, 4.8, 1.6, 0, 'ml', true, NULL),
  ('Lait écrémé', 'Skimmed milk', 'dairy', 35, 3.4, 5, 0.1, 0, 'ml', true, NULL),
  ('Lait entier', 'Whole milk', 'dairy', 64, 3.2, 4.8, 3.5, 0, 'ml', true, NULL),
  ('Lait d''amande sans sucre', 'Unsweetened almond milk', 'dairy', 17, 0.6, 0.3, 1.5, 0.4, 'ml', true, NULL),
  ('Lait de soja sans sucre', 'Unsweetened soy milk', 'dairy', 33, 3.3, 0.6, 1.8, 0.5, 'ml', true, NULL),
  ('Lait de coco', 'Coconut milk', 'dairy', 230, 2.3, 6, 24, 0, 'ml', true, NULL),
  ('Yaourt nature 0%', 'Plain yogurt 0%', 'dairy', 41, 4.2, 6, 0.1, 0, 'g', true, NULL),
  ('Yaourt nature entier', 'Plain whole yogurt', 'dairy', 61, 3.5, 4.7, 3.3, 0, 'g', true, NULL),
  ('Yaourt grec 0%', 'Greek yogurt 0%', 'dairy', 59, 10, 3.6, 0.4, 0, 'g', true, NULL),
  ('Yaourt grec entier', 'Greek yogurt full fat', 'dairy', 97, 9, 3.6, 5, 0, 'g', true, NULL),
  ('Skyr nature', 'Plain skyr', 'dairy', 63, 11, 4, 0.2, 0, 'g', true, NULL),
  ('Fromage blanc 0%', 'Fromage blanc 0%', 'dairy', 47, 8, 4, 0.1, 0, 'g', true, NULL),
  ('Fromage blanc 3%', 'Fromage blanc 3%', 'dairy', 75, 7.7, 4.4, 3, 0, 'g', true, NULL),
  ('Cottage cheese', 'Cottage cheese', 'dairy', 98, 11, 3.4, 4.3, 0, 'g', true, NULL),
  ('Mozzarella', 'Mozzarella', 'dairy', 280, 18, 2.2, 22, 0, 'g', true, NULL),
  ('Mozzarella light', 'Light mozzarella', 'dairy', 175, 22, 2, 9, 0, 'g', true, NULL),
  ('Feta', 'Feta', 'dairy', 264, 14, 4, 21, 0, 'g', true, NULL),
  ('Parmesan', 'Parmesan', 'dairy', 392, 36, 4, 26, 0, 'g', true, NULL),
  ('Comté', 'Comté', 'dairy', 414, 28, 0.5, 34, 0, 'g', true, NULL),
  ('Emmental', 'Emmental', 'dairy', 380, 28, 1.5, 29, 0, 'g', true, NULL),
  ('Chèvre frais', 'Fresh goat cheese', 'dairy', 200, 14, 3, 15, 0, 'g', true, NULL),
  ('Ricotta', 'Ricotta', 'dairy', 174, 11, 3, 13, 0, 'g', true, NULL),

  -- ---- BEVERAGE ----
  ('Eau plate', 'Still water', 'beverage', 0, 0, 0, 0, 0, 'ml', true, NULL),
  ('Eau gazeuse', 'Sparkling water', 'beverage', 0, 0, 0, 0, 0, 'ml', true, NULL),
  ('Café noir', 'Black coffee', 'beverage', 2, 0.3, 0, 0, 0, 'ml', true, NULL),
  ('Thé vert', 'Green tea', 'beverage', 1, 0.2, 0, 0, 0, 'ml', true, NULL),
  ('Thé noir', 'Black tea', 'beverage', 1, 0, 0.3, 0, 0, 'ml', true, NULL),
  ('Jus d''orange', 'Orange juice', 'beverage', 45, 0.7, 10, 0.2, 0.2, 'ml', true, NULL),
  ('Jus de pomme', 'Apple juice', 'beverage', 46, 0.1, 11, 0.1, 0.2, 'ml', true, NULL),
  ('Boisson énergétique', 'Sports drink', 'beverage', 26, 0, 6.4, 0, 0, 'ml', true, NULL),
  ('Bière blonde', 'Lager beer', 'beverage', 43, 0.5, 3.6, 0, 0, 'ml', true, NULL),
  ('Vin rouge', 'Red wine', 'beverage', 85, 0.1, 2.6, 0, 0, 'ml', true, NULL),
  ('Soda cola', 'Cola soda', 'beverage', 42, 0, 10.6, 0, 0, 'ml', true, NULL),
  ('Soda zéro', 'Zero soda', 'beverage', 1, 0, 0, 0, 0, 'ml', true, NULL),

  -- ---- SUPPLEMENT ----
  ('Créatine monohydrate', 'Creatine monohydrate', 'supplement', 0, 0, 0, 0, 0, 'g', true, NULL),
  ('BCAA poudre', 'BCAA powder', 'supplement', 350, 87, 0, 0, 0, 'g', true, NULL),
  ('EAA poudre', 'EAA powder', 'supplement', 360, 85, 5, 0, 0, 'g', true, NULL),
  ('Multivitamines', 'Multivitamin', 'supplement', 0, 0, 0, 0, 0, 'piece', true, NULL),
  ('Oméga 3 (capsule)', 'Omega 3 (capsule)', 'supplement', 9, 0, 0, 1, 0, 'piece', true, NULL),
  ('Pré-workout', 'Pre-workout', 'supplement', 20, 0, 5, 0, 0, 'g', true, NULL),
  ('Maltodextrine', 'Maltodextrin', 'supplement', 380, 0, 95, 0, 0, 'g', true, NULL),

  -- ---- OTHER (sauces, condiments, sweet) ----
  ('Miel', 'Honey', 'other', 304, 0.3, 82, 0, 0.2, 'tbsp', true, NULL),
  ('Sirop d''érable', 'Maple syrup', 'other', 260, 0, 67, 0.1, 0, 'tbsp', true, NULL),
  ('Confiture fraise', 'Strawberry jam', 'other', 250, 0.4, 60, 0.1, 1, 'tbsp', true, NULL),
  ('Sucre blanc', 'White sugar', 'other', 387, 0, 100, 0, 0, 'tsp', true, NULL),
  ('Chocolat noir 70%', 'Dark chocolate 70%', 'other', 598, 7.8, 46, 43, 11, 'g', true, NULL),
  ('Chocolat au lait', 'Milk chocolate', 'other', 535, 7.6, 59, 30, 3.4, 'g', true, NULL),
  ('Cacao en poudre', 'Cocoa powder', 'other', 228, 19.6, 57, 14, 33, 'tbsp', true, NULL),
  ('Mayonnaise', 'Mayonnaise', 'other', 680, 1, 1.3, 75, 0, 'tbsp', true, NULL),
  ('Ketchup', 'Ketchup', 'other', 112, 1.7, 26, 0.3, 0.4, 'tbsp', true, NULL),
  ('Moutarde', 'Mustard', 'other', 66, 4, 5, 4, 4, 'tsp', true, NULL),
  ('Sauce soja', 'Soy sauce', 'other', 53, 8, 5, 0, 0.8, 'tbsp', true, NULL),
  ('Vinaigre balsamique', 'Balsamic vinegar', 'other', 88, 0.5, 17, 0, 0, 'tbsp', true, NULL),
  ('Sel', 'Salt', 'other', 0, 0, 0, 0, 0, 'tsp', true, NULL),
  ('Sirop d''agave', 'Agave syrup', 'other', 310, 0, 76, 0.5, 0.2, 'tbsp', true, NULL)
ON CONFLICT (lower(name_fr), category) WHERE is_system = true DO NOTHING;