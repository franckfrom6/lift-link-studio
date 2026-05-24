# Orchestration coach → athlete (Mode B)

How to prepare app state when athlete tests have preconditions that only a coach can establish.

## Principle

Athlete tests run against a state where someone (the coach) has already created programs, assigned them, set nutrition plans, etc. The skill replays the coach's actions in an **idempotent** way before running the athlete batch.

**Idempotent** means : check if the state exists. Create only if missing. **Never delete anything.**

## Why idempotent and not reset

- The tests run against `https://fit.from6agency.com/` — a shared environment, not isolated staging
- Destructive operations risk deleting real data if the wrong account is targeted
- Pre-beta solo founder context — "approximately clean state" is acceptable; periodic manual cleanup is fine

When state drift becomes a problem (sessions piling up, programs duplicated), the user does a manual cleanup via the Supabase dashboard. The skill **never** triggers this.

## Precondition catalog

This is the mapping of precondition names to coach actions. When a new precondition pattern appears in classification, **add it here first**, then implement it.

### `athlete-linked-to-coach`

**State required** : test-athlete account is in test-coach's student list.

**Idempotent check** :
1. Login as coach → navigate to `/coach/students`
2. Check if `test-athlete@f6gym.test` appears in the student list

**Setup if missing** :
1. Use invite link flow (T-C-120) to generate a link
2. Open link in second context, login as athlete, accept link
3. Return to coach, verify athlete now appears

**Notes** : this should be set up once and never need to be re-done. If it's missing, something unusual happened (athlete unlinked manually).

---

### `athlete-has-programmed-session-today`

**State required** : test-athlete has at least one programmed strength session on today's date or in the current week.

**Idempotent check** :
1. Login as coach → open test-athlete's detail
2. Check if active program has sessions in the current week

**Setup if missing** :
1. Create or open existing "E2E Test Program"
2. Add 3 sessions to current week (Monday, Wednesday, Friday)
3. Each session : 3 exercises with sets/reps/rest defined

**Reused canonical program** : always use the same program name (`E2E Test Program`) so checks are deterministic.

---

### `athlete-has-completed-session`

**State required** : test-athlete has at least one fully completed session in history (needed for T-A-31 "previous weight" suggestions).

**Idempotent check** :
1. Login as athlete → navigate to `/student/progress`
2. Check if any session shows as completed

**Setup if missing** :
1. Requires a programmed session first (precondition chain : `athlete-has-programmed-session-today`)
2. Login as athlete, complete one session (log 1-2 sets per exercise, validate, end session)

**Caveat** : this setup runs as athlete, not coach. It's still a precondition spec, just persona = athlete.

---

### `coach-has-multiple-athletes`

**State required** : test-coach has 2+ linked athletes (needed for T-C-12, T-C-13, T-C-14 — list and kanban views).

**Idempotent check** :
1. Login as coach → student list count ≥ 2

**Setup if missing** :
1. Generate a second test athlete via Supabase admin (create `test-athlete-2@f6gym.test`)
2. Link via invite flow

**Open question** : do we have a `test-athlete-2` account? If not, this precondition can't be satisfied automatically. Flag to user before running tests that need it.

---

### `coach-defined-nutrition-plan`

**State required** : test-athlete has a nutrition plan with non-zero macro targets set by the coach.

**Idempotent check** :
1. Login as coach → open test-athlete's nutrition plan page
2. Check if calories/protein/carbs/fat all > 0

**Setup if missing** :
1. Set macros to canonical values : 2200 kcal / 150g P / 250g C / 70g F
2. Save

---

## Precondition spec structure

Generate spec at `tests/e2e/preconditions/<name>.spec.ts`. The name matches the precondition key (e.g. `athlete-has-programmed-session-today.spec.ts`).

```typescript
import { test, expect } from '@playwright/test';
import { loginAsPersona } from '../helpers/auth';

test.describe('Precondition: athlete-has-programmed-session-today', () => {
  test('ensure programmed session exists', async ({ page }) => {
    await loginAsPersona(page, 'coach');
    await page.goto('/coach/students');

    // Open test-athlete detail
    await page.getByText('Athlete Test').click();

    // Check current state
    const programCard = page.getByTestId('active-program-card');
    const hasProgram = await programCard.isVisible().catch(() => false);

    if (!hasProgram) {
      // Setup branch
      await page.getByRole('button', { name: /nouveau programme/i }).click();
      // ... fill form, create program, assign sessions ...
    } else {
      // Verify it has sessions in current week, add if missing
      // ...
    }

    // Final assertion : state is what athlete tests expect
    await expect(programCard).toBeVisible();
  });
});
```

## Chaining preconditions

When a precondition depends on another, encode the chain explicitly in the spec :

```typescript
test.beforeAll(async ({ browser }) => {
  // Run parent precondition first
  await runPrecondition(browser, 'athlete-has-programmed-session-today');
  // Then this one
});
```

A simple helper `runPrecondition(browser, name)` can be added to `tests/e2e/helpers/preconditions.ts` to keep this clean.

## Running preconditions before a batch

Playwright supports global setup files. Configure `playwright.config.ts` to run preconditions first :

```typescript
export default defineConfig({
  // ...
  globalSetup: require.resolve('./tests/e2e/preconditions/global-setup.ts'),
});
```

The `global-setup.ts` invokes only the preconditions actually needed for the current batch. The skill determines which preconditions are needed by reading `test-registry.json` for the in-scope tests.

## What this skill must NEVER do

- ❌ DELETE programs, sessions, check-ins, or any user data
- ❌ Use Supabase admin API to manipulate the database directly (precondition specs go through the app UI, like a real user would)
- ❌ Run preconditions against an environment other than `https://fit.from6agency.com/` without explicit user confirmation
- ❌ Create more than the minimum data needed (e.g. don't create 10 programs when 1 suffices)
- ❌ Hard-code state expectations that diverge from the script's stated preconditions
