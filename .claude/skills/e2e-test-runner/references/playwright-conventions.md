# Conventions Playwright — Projet Coaching App

## Stratégie de sélecteurs (par ordre de préférence)

1. **`getByTestId('...')`** — quand un `data-testid` existe sur l'élément. Préféré.
2. **`getByRole('button', { name: /.../ })`** — par défaut pour les éléments interactifs (boutons, liens, inputs).
3. **`getByLabel(/.../)`** — pour les champs de formulaire.
4. **`getByText(/.../)`** — uniquement pour les assertions de contenu, pas pour cliquer.
5. ❌ **Jamais** : sélecteurs CSS (`.bg-blue-500`, `div > span:nth-child(2)`). Les classes Tailwind changent à chaque update Lovable.

Si un élément critique n'a pas de `data-testid`, le noter dans la section "Observations annexes" du rapport avec une recommandation d'en ajouter un. C'est de la dette de testabilité.

## Convention de nommage `data-testid`

Format recommandé à signaler à l'équipe (si pas encore en place) :
- `<feature>-<element>-<variant>` en kebab-case
- Exemples : `client-list-add-button`, `program-editor-save`, `session-log-rep-input`

## Viewport — desktop vs mobile

Defined dans `playwright.config.ts` via les `projects`. Dans un test :

```typescript
// Pour forcer un viewport dans un test spécifique (rare) :
test.use({ viewport: { width: 375, height: 812 } });
```

Mais en général, lancer via `--project=mobile` ou `--project=desktop`.

Pour tester un même flow sur les deux, écrire un seul spec et le lancer avec les deux projets — Playwright dédoublera.

## Fixtures et données de test

Toutes les données de test vivent dans `tests/e2e/fixtures/`. Jamais en dur dans les specs.

- `personas.ts` — emails des comptes de test
- `programs.ts` — templates de programmes pour les tests de création
- `clients.ts` — profils clients factices

Si un test crée des données (un nouveau client par exemple), utiliser un suffixe timestamp pour éviter les collisions entre runs :

```typescript
const clientName = `Test Client ${Date.now()}`;
```

Et prévoir une étape de teardown (ou un test de cleanup périodique).

## Login email+password — pattern actuel

```typescript
import { loginAsPersona } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await loginAsPersona(page, 'coach');
});
```

`loginAsPersona` lit les credentials depuis `.env.test` (chargé automatiquement par `playwright.config.ts` via dotenv). Aucune intervention manuelle requise. Si une variable manque, la fonction lève une erreur explicite avec le nom de la variable à remplir.

Variables requises dans `.env.test` :
```
TEST_COACH_EMAIL=test-coach@f6gym.test
TEST_COACH_PASSWORD=<à remplir>
TEST_ATHLETE_EMAIL=test-athlete@f6gym.test
TEST_ATHLETE_PASSWORD=<à remplir>
```

⚠️ Pour les runs en série (plusieurs tests), chaque test refait un login complet. Pas de session sharing pour l'instant — ajouter si les temps de run deviennent problématiques.

## Structure d'un spec

```typescript
import { test, expect } from '@playwright/test';
import { loginAsPersona } from './helpers/auth';

test.describe('Coach — Création client', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await loginAsPersona(page, 'coach');
  });

  test('Étape 1 : accès au formulaire de création client', async ({ page }) => {
    await page.getByTestId('clients-nav-link').click();
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
    await page.getByTestId('client-list-add-button').click();
    await expect(page).toHaveURL(/clients\/new/);
  });

  test('Étape 2 : remplissage et soumission', async ({ page }) => {
    // ...
  });
});
```

## Assertions — patterns utiles

```typescript
// Présence visible
await expect(page.getByText(/programme créé/i)).toBeVisible();

// URL après action
await expect(page).toHaveURL(/programs\/\d+/);

// Compteur / liste
await expect(page.getByTestId('client-row')).toHaveCount(5);

// Attribut
await expect(page.getByTestId('save-button')).toBeDisabled();

// Toast / notification éphémère (attention au timeout court)
await expect(page.getByRole('status')).toContainText(/succès/i);
```

## Screenshots aux checkpoints

À chaque checkpoint majeur d'un scénario, capturer un screenshot pour le rapport :

```typescript
await page.screenshot({
  path: `tests/e2e/reports/screenshots/${testInfo.title}-step1.png`,
  fullPage: true,
});
```

Ces screenshots sont référencés dans le rapport final.

## Gérer les flakes

Si un test échoue de façon intermittente :

1. **Ne pas** ajouter de `page.waitForTimeout(2000)` — c'est un anti-pattern.
2. Utiliser des waits explicites : `await expect(locator).toBeVisible()`.
3. Si une vraie race condition existe côté app (state qui clignote), c'est un bug app à reporter — pas à masquer.

## Mode debug

Pour debug un test en cours d'écriture :

```bash
npx playwright test tests/e2e/<flow>.spec.ts --debug
```

Ouvre l'inspecteur, permet d'inspecter le DOM, tester les sélecteurs en live.

## Codegen pour découvrir les sélecteurs

```bash
npx playwright codegen https://fit.from6agency.com
```

Utile pour explorer rapidement et identifier les `data-testid` disponibles. **Ne pas** coller le code généré tel quel — l'utiliser comme référence pour écrire un spec propre.
