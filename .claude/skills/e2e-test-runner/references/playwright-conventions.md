# Conventions Playwright — Projet Coaching App

## Stratégie de sélecteurs (par ordre de préférence)

1. **`getByTestId('...')`** — quand un `data-testid` existe sur l'élément. Préféré.
2. **`getByRole('button', { name: /.../ })`** — par défaut pour les éléments interactifs (boutons, liens, inputs).
3. **`getByLabel(/.../)`** — pour les champs de formulaire.
4. **`getByText(/.../)`** — uniquement pour les assertions de contenu, pas pour cliquer.
5. ❌ **Jamais** : sélecteurs CSS (`.bg-blue-500`, `div > span:nth-child(2)`). Les classes Tailwind changent à chaque update Lovable.

Si un élément critique n'a pas de `data-testid`, le noter dans la section "Dette de testabilité" du rapport avec une recommandation d'en ajouter un.

## Convention de nommage `data-testid`

Format à appliquer côté app : `<feature>-<element>-<variant>` en kebab-case.

Exemples : `client-list-add-button`, `program-editor-save`, `session-log-rep-input`.

## Viewport — desktop vs mobile

Defined dans `playwright.config.ts` via les `projects`.

Pour lancer un test sur un viewport spécifique :
```bash
npx playwright test --project=mobile
npx playwright test --project=desktop
```

Pour un test multi-viewport, le même spec peut être lancé avec les deux projets.

## Fixtures et données de test

Toutes les données de test vivent dans `tests/e2e/fixtures/`. Jamais en dur dans les specs.

- `personas.ts` — emails des comptes de test
- `programs.ts` — templates de programmes pour les tests de création (canonical : "E2E Test Program")
- `clients.ts` — profils clients factices

Pour les data créées dynamiquement par un test, utiliser un suffixe timestamp pour éviter les collisions :

```typescript
const clientName = `Test Client ${Date.now()}`;
```

## Login — pattern email/password

Les comptes de test utilisent email + password classique (pas magic link). Credentials lus depuis `.env.test` via `dotenv` (chargé par `playwright.config.ts`).

```typescript
import { test, expect } from '@playwright/test';
import { loginAsPersona } from './helpers/auth';

test.describe('Coach — Création client', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPersona(page, 'coach');
  });

  test('création client', async ({ page }) => {
    // ...
  });
});
```

Le helper `loginAsPersona` :
1. Navigue vers `/` (landing) → clique "Se connecter" pour atteindre `/auth`
2. Lit `process.env.TEST_<PERSONA>_EMAIL` et `process.env.TEST_<PERSONA>_PASSWORD`
3. Remplit, soumet
4. Vérifie qu'on n'est plus sur `/login|/auth` (post-login assertion)

Si une variable d'env manque, le helper lève une erreur explicite.

## Structure d'un spec — Mode A (ad-hoc)

```typescript
import { test, expect } from '@playwright/test';
import { loginAsPersona } from './helpers/auth';

test.describe('Coach — Création client', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await loginAsPersona(page, 'coach');
  });

  test('Étape 1 : accès au formulaire', async ({ page }) => {
    await page.getByTestId('clients-nav-link').click();
    await expect(page).toHaveURL(/clients/);
  });

  test('Étape 2 : remplissage', async ({ page }) => {
    // ...
  });
});
```

## Structure d'un spec — Mode B (batch depuis script)

```typescript
import { test, expect } from '@playwright/test';
import { loginAsPersona } from './helpers/auth';

/**
 * Generated from docs/testing/athlete-test-script.md — Section 3
 * Last regenerated: 2026-05-24
 * Categories included: auto, auto-with-precond
 * Excluded (manual-only): T-A-36, T-A-37
 * Excluded (auto-ai-flaky, opted out by user): T-A-18
 */
test.describe('Athlete — Section 3 Live Session [mobile]', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPersona(page, 'athlete');
  });

  test('T-A-30 · Session loads correctly', async ({ page }) => {
    // From script:
    //   Steps:    Start a session from the preview
    //   Expected: First exercise active, timer ticking, target sets/reps visible
    //   Watch:    No active exercise, timer frozen, wrong exercise highlighted

    await page.goto('/student');
    // ... navigation to a programmed session ...
    await page.getByRole('button', { name: /démarrer la séance/i }).click();

    await expect(page).toHaveURL(/\/student\/session\/[^/]+$/);
    await expect(page.getByTestId('active-exercise-card')).toBeVisible();
    await expect(page.getByTestId('session-timer')).not.toContainText('00:00:00');
  });

  // Tests skipped (manual-only)
  test.skip('T-A-36 · Rest timer silent mode (iOS)', async () => {
    // Not automatable in Playwright. See report for manual checklist.
  });
});
```

## Assertions utiles

```typescript
// Présence visible
await expect(page.getByText(/programme créé/i)).toBeVisible();

// URL après action
await expect(page).toHaveURL(/programs\/\d+/);

// Compteur / liste
await expect(page.getByTestId('client-row')).toHaveCount(5);

// Attribut
await expect(page.getByTestId('save-button')).toBeDisabled();

// Toast
await expect(page.getByRole('status')).toContainText(/succès/i);

// Pour auto-ai-flaky : présence et shape, pas contenu
const blocks = page.getByTestId('run-block');
await expect(blocks.first()).toBeVisible({ timeout: 30_000 }); // VOLT peut prendre du temps
await expect(blocks).toHaveCount({ minimum: 1 });
```

## Screenshots aux checkpoints

À chaque checkpoint majeur, capturer pour le rapport :

```typescript
await page.screenshot({
  path: `tests/e2e/reports/screenshots/${test.info().title}-step1.png`,
  fullPage: true,
});
```

## Gérer les flakes

- **Ne pas** utiliser `page.waitForTimeout(2000)` — anti-pattern.
- Préférer `await expect(locator).toBeVisible()` qui retry automatiquement.
- Pour les tests `auto-with-caveat` (background, reload), accepter une fenêtre de tolérance plus large mais documenter pourquoi dans un commentaire au-dessus du test.

## Patterns Mode B spécifiques

### Skipping de tests classifiés `manual-only`

```typescript
test.skip('T-A-36 · Rest timer silent mode (iOS)', async () => {
  // Manual-only — see batch report for procedure.
});
```

`test.skip` marque le test comme volontairement sauté (apparaît dans le rapport, contrairement à un commentaire).

### Tests `auto-with-caveat` (simulation imparfaite)

```typescript
test('T-A-35 · Rest timer — background', async ({ page }) => {
  // CAVEAT: True iOS app eviction not simulable via Playwright.
  // We simulate visibility change but not full process kill.
  await page.goto('/student/session/...');

  await page.getByRole('button', { name: /valider/i }).click();
  // Rest timer starts

  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(30_000); // 30s "background"
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

  const timerText = await page.getByTestId('rest-timer').textContent();
  // Should show ~30s less than the original duration, not full duration
  expect(timerText).not.toContain('00:90'); // assuming 90s original
});
```

### Tests `auto-ai-flaky` (VOLT)

```typescript
test('T-A-18 · VOLT creates session', async ({ page }) => {
  await page.getByTestId('volt-sidebar-toggle').click();
  await page.getByTestId('volt-input').fill('Crée moi une séance de footing 40 minutes pour demain');
  await page.getByRole('button', { name: /envoyer/i }).click();

  // Wait for VOLT response (can be slow)
  await expect(page.getByTestId('volt-message-assistant').last()).toBeVisible({ timeout: 60_000 });

  // Assertion is presence and shape, NOT exact content
  await page.goto('/student');
  const tomorrowTile = page.getByTestId('day-tile-tomorrow');
  await expect(tomorrowTile.getByTestId('session-chip')).toHaveCount({ minimum: 1 });
});
```

### Préconditions via globalSetup

`playwright.config.ts` peut référencer un `globalSetup` qui exécute les préconditions avant tout test. La skill détermine les préconditions nécessaires en lisant `test-registry.json` pour les tests en scope.

Voir `references/orchestration-coach-athlete.md` pour les patterns.

## Mode debug

```bash
npx playwright test tests/e2e/<spec> --debug
```

Ouvre l'inspecteur, permet d'inspecter le DOM et tester les sélecteurs en live.

## Codegen pour découvrir les sélecteurs

```bash
npx playwright codegen https://fit.from6agency.com
```

Utile pour explorer rapidement. Ne pas coller le code généré tel quel — l'utiliser comme référence.
