import { Page, expect } from '@playwright/test';
import type { PersonaKey } from '../fixtures/personas';

const CREDENTIALS: Record<PersonaKey, { emailVar: string; passwordVar: string }> = {
  coach: {
    emailVar: 'TEST_COACH_EMAIL',
    passwordVar: 'TEST_COACH_PASSWORD',
  },
  athlete: {
    emailVar: 'TEST_ATHLETE_EMAIL',
    passwordVar: 'TEST_ATHLETE_PASSWORD',
  },
};

function resolveCredentials(persona: PersonaKey): { email: string; password: string } {
  const { emailVar, passwordVar } = CREDENTIALS[persona];
  const email = process.env[emailVar];
  const password = process.env[passwordVar];

  if (!email || !password) {
    throw new Error(
      `Credentials manquants pour le persona "${persona}". ` +
        `Vérifie que ${emailVar} et ${passwordVar} sont renseignés dans .env.test.`
    );
  }

  return { email, password };
}

export async function loginAsPersona(page: Page, persona: PersonaKey) {
  const { email, password } = resolveCredentials(persona);

  await page.goto('/');

  // La page racine est une landing page — accès au login via le lien header
  await page.getByRole('link', { name: /se connecter/i }).click();

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/mot de passe|password/i).fill(password);
  await page.getByRole('button', { name: /se connecter|sign in|connexion/i }).click();

  await expect(page).not.toHaveURL(/login|sign-in/i, { timeout: 15_000 });
}
