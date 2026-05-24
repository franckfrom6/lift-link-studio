# Setup Playwright (première fois uniquement)

À exécuter une seule fois à la racine du projet, si Playwright n'est pas encore installé.

## 1. Installation

```bash
npm init playwright@latest -- --quiet --browser=chromium --lang=ts --install-deps
```

Réponses recommandées si le prompt interactif n'est pas bypass :
- Tests directory: `tests/e2e`
- TypeScript: yes
- GitHub Actions: no (à activer plus tard)
- Install browsers: yes

## 2. Configuration

Remplacer `playwright.config.ts` à la racine par cette config adaptée au projet :

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // évite les collisions sur compte de test partagé
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // un seul worker pour éviter les conflits sur les comptes de test
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'https://fit.from6agency.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
```

## 3. Structure de dossiers à créer

```
tests/
└── e2e/
    ├── fixtures/         # données de test (personas, programmes types, etc.)
    │   └── personas.ts
    ├── helpers/          # utilitaires partagés
    │   └── auth.ts       # stub login magic link
    ├── scenarios/        # docs Markdown décrivant les scénarios (Step 2)
    ├── reports/          # rapports de run (Step 5)
    └── *.spec.ts         # specs Playwright (Step 3)
```

## 4. Fichier `tests/e2e/fixtures/personas.ts`

```typescript
export const PERSONAS = {
  coach: {
    email: 'TODO_COACH_EMAIL@test.com', // à remplir avec l'email de test coach
    role: 'coach' as const,
  },
  athlete: {
    email: 'TODO_ATHLETE_EMAIL@test.com', // à remplir avec l'email de test athlete
    role: 'athlete' as const,
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;
```

Demander à l'utilisateur les deux emails de test au moment du setup et les coller ici.

## 5. Fichier `tests/e2e/helpers/auth.ts`

```typescript
import { Page, expect } from '@playwright/test';
import { PERSONAS, PersonaKey } from '../fixtures/personas';

/**
 * Login via magic link. Pour l'instant semi-automatisé :
 * 1. Remplit l'email
 * 2. Soumet le formulaire
 * 3. Met en pause — l'utilisateur clique le magic link manuellement
 * 4. Reprend une fois la session active détectée
 *
 * TODO: automatiser via interception mail (voir magic-link-roadmap.md)
 */
export async function loginAsPersona(page: Page, persona: PersonaKey) {
  const { email } = PERSONAS[persona];

  await page.goto('/');
  // TODO: adapter les selectors aux vrais data-testid de la page login
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole('button', { name: /se connecter|sign in|magic link/i }).click();

  console.log(`\n⏸  En attente : clique le magic link envoyé à ${email}\n`);
  await page.pause();

  // Vérifier qu'on est bien connecté après reprise
  await expect(page).not.toHaveURL(/login|sign-in/i, { timeout: 30_000 });
}
```

## 6. Ajouter au `.gitignore`

```
playwright-report/
test-results/
tests/e2e/reports/
```

## 7. Scripts package.json

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:desktop": "playwright test --project=desktop",
    "test:e2e:mobile": "playwright test --project=mobile",
    "test:e2e:report": "playwright show-report"
  }
}
```

## 8. Vérification

```bash
npx playwright --version
ls tests/e2e/
```

Doit afficher la version installée et la structure de dossiers.
