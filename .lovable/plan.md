## Bi-set (superset) support

A sizable feature touching DB, coach editor, and athlete live session. Plan below before implementation.

### 1. DB migration
- Add `superset_group INTEGER DEFAULT NULL` to `public.session_exercises`.
- No RLS changes needed (inherits existing policies).
- After migration approval, generated types will include the new column.

### 2. Coach side — program editor
- Locate the component rendering ordered exercises within a session (likely `src/components/coach/SessionEditor.tsx` or similar — will read first).
- Between each pair of adjacent exercise rows, render a small "↕ Bi-set" toggle button.
- Click behavior:
  - If neither exercise has a `superset_group`, assign both the next free integer for that session.
  - If already linked together, clicking unlinks (set both to `null`).
  - If one is already in a different group, replace with the new shared group.
- Visual indicator when linked: vertical bracket / chip "↕ Bi-set" rendered between the two rows.
- Persist via existing UPSERT save path (so `superset_group` is included in the payload).

### 3. Athlete live session
- In `src/pages/student/LiveSession.tsx`:
  - Pre-compute groups: consecutive exercises sharing the same non-null `superset_group` become a "block".
  - Render block as a single card containing both `EnhancedExerciseCard`s stacked with a divider, header label "Bi-set".
  - Set-validation flow:
    - User validates set N of exercise A → does NOT trigger rest timer; highlight exercise B's set N as next.
    - User validates set N of exercise B → triggers a single rest timer using A's `rest_seconds`.
    - After rest, both cards advance to set N+1.
  - Header label per round: `Série N : {A.name} + {B.name} · Repos {rest}s`.
  - Completed_sets are still inserted per exercise (no duplication).
- Non-superset exercises behavior unchanged.

### 4. Set counting fix
- Achieved naturally: each exercise's sets log independently to `completed_sets`, but rest timer is gated on both exercises completing the same set index.

### Files touched
- New SQL migration
- `src/components/coach/SessionEditor.tsx` (or actual editor)
- `src/pages/student/LiveSession.tsx`
- Possibly small helper in `src/components/student/EnhancedExerciseCard.tsx` to suppress its internal rest-timer trigger when part of a superset (controlled mode).

### Order of execution
1. Run DB migration (await approval).
2. Update coach editor UI + save payload.
3. Update live session rendering + rest-timer gating.
4. Smoke test in preview.

Confirm and I'll start with the migration.
