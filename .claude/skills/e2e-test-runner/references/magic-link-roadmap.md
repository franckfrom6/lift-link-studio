> ⚠️ **OBSOLÈTE** — Le login magic link a été abandonné. Les comptes de test utilisent désormais email + password classique. Les credentials sont dans `.env.test` (non commité) et le pattern live est dans `playwright-conventions.md`. Ce document est conservé pour mémoire uniquement.

---

# Roadmap — Automatisation du login magic link

## État actuel (v0)

Le helper `loginAsPersona()` utilise `page.pause()` après soumission du formulaire.
L'utilisateur clique manuellement le magic link reçu dans sa boîte mail, puis clique
"Resume" dans l'inspecteur Playwright. Pas idéal pour des runs en série, mais
suffisant pour démarrer.

**Limite principale** : pas de run headless / CI. Un humain est requis à chaque login.

## Options pour automatiser (à choisir plus tard)

### Option A — Mailosaur (recommandé pour la simplicité)

Service tiers spécialisé tests E2E avec emails jetables.

- **Coût** : gratuit jusqu'à 100 emails/jour, payant au-delà (~10$/mois pour usage modéré)
- **Setup** : créer un compte, récupérer une API key, créer 2 adresses dédiées (coach + athlete)
- **Flow** :
  1. Le formulaire de login soumet l'email Mailosaur
  2. Le helper interroge l'API Mailosaur pour récupérer le dernier mail reçu
  3. Parse le HTML du mail, extrait le lien magic
  4. Navigate Playwright vers ce lien → session active
- **Pros** : très propre, fiable, supporté officiellement par Playwright
- **Cons** : dépendance tierce, coût récurrent

### Option B — IMAP sur boîte Gmail dédiée

Utiliser une vraie boîte Gmail (gratuite) avec accès IMAP.

- **Coût** : gratuit
- **Setup** : créer 2 comptes Gmail, activer "App Password", se connecter via lib IMAP Node (`imapflow` ou `node-imap`)
- **Flow** : pareil que Mailosaur mais via IMAP
- **Pros** : gratuit, pas de dépendance SaaS
- **Cons** : plus de plomberie, Gmail peut throttler, App Passwords moins pérennes

### Option C — Backdoor de dev

Demander à l'équipe (toi en l'occurrence) d'exposer un endpoint dev-only qui retourne le magic link pour un email donné, sans envoyer l'email.

- **Coût** : 0
- **Setup** : ajouter un endpoint type `POST /dev/magic-link?email=...` protégé par un secret env-var, qui retourne directement l'URL du magic link
- **Flow** : helper appelle l'endpoint, récupère l'URL, navigate
- **Pros** : ultra rapide, déterministe, pas de dépendance externe
- **Cons** : nécessite du code côté app, doit être strictement désactivé en prod (feature flag + secret)

## Recommandation

Pour passer à l'échelle (CI, runs nocturnes) : **Option C** est imbattable si tu peux l'ajouter côté app. Sinon **Option A** pour démarrer vite proprement.

## Plan de migration depuis le stub actuel

Quand l'option est choisie :

1. Implémenter le helper `getMagicLinkFor(email)` correspondant
2. Modifier `helpers/auth.ts` : remplacer `page.pause()` par :
   ```typescript
   const magicLink = await getMagicLinkFor(email);
   await page.goto(magicLink);
   ```
3. Tester sur un seul scénario, vérifier que la session est bien active
4. Activer le mode parallel dans `playwright.config.ts` (`fullyParallel: true`)
5. Ajouter une CI GitHub Actions qui lance les tests sur chaque PR
