
-- 1. Build mapping of duplicates → keeper
CREATE TEMP TABLE _ex_dedup AS
WITH norm AS (
  SELECT
    id,
    created_at,
    is_default,
    COALESCE(created_by, '00000000-0000-0000-0000-000000000000'::uuid) AS owner_key,
    lower(btrim(regexp_replace(name, '\s+', ' ', 'g'))) AS name_key
  FROM public.exercises
),
ranked AS (
  SELECT
    id, owner_key, name_key,
    FIRST_VALUE(id) OVER (
      PARTITION BY owner_key, name_key
      ORDER BY is_default DESC, created_at ASC, id ASC
    ) AS keeper_id
  FROM norm
)
SELECT id AS dup_id, keeper_id
FROM ranked
WHERE id <> keeper_id;

-- 2. Remap FKs
UPDATE public.session_exercises se
SET exercise_id = d.keeper_id
FROM _ex_dedup d
WHERE se.exercise_id = d.dup_id;

UPDATE public.exercise_favorites f
SET exercise_id = d.keeper_id
FROM _ex_dedup d
WHERE f.exercise_id = d.dup_id;

UPDATE public.exercise_video_requests r
SET exercise_id = d.keeper_id
FROM _ex_dedup d
WHERE r.exercise_id = d.dup_id;

UPDATE public.video_suggestions v
SET exercise_id = d.keeper_id
FROM _ex_dedup d
WHERE v.exercise_id = d.dup_id;

-- 3. Delete duplicates
DELETE FROM public.exercises e
USING _ex_dedup d
WHERE e.id = d.dup_id;

-- 4. Unique index preventing future duplicates per owner (NULL owner = global default library)
CREATE UNIQUE INDEX IF NOT EXISTS exercises_unique_name_per_owner
ON public.exercises (
  COALESCE(created_by, '00000000-0000-0000-0000-000000000000'::uuid),
  lower(btrim(regexp_replace(name, '\s+', ' ', 'g')))
);
