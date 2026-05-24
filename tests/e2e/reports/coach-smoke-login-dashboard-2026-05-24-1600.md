# Test Run Report

> ⚠️ Format figé — consommé en aval pour générer des prompts Lovable.
> Ne pas modifier la structure sans coordination.

## Métadonnées

- **Scope** : Coach — Smoke test login + tableau de bord
- **Scénario source** : `tests/e2e/scenarios/coach-smoke-login-dashboard.md`
- **Spec exécutée** : `tests/e2e/coach-smoke-login-dashboard.spec.ts`
- **Persona(s)** : `coach`
- **Viewport(s)** : `desktop`
- **Date** : 2026-05-24 16:00
- **Durée totale du run** : 3.5s
- **Verdict** : `PASS`

## Synthèse

- **Étapes total** : 3
- **Étapes passées** : 3
- **Étapes échouées** : 0
- **Anomalies bloquantes** : 0
- **Anomalies non-bloquantes** : 0
- **Observations UX** : 2

## Scénario déroulé

### Étape 1 — Login email+password

- **Actions** : Navigation vers `/`, clic sur le lien "Se connecter" (header), remplissage email + password, soumission
- **Attendu** : Session active, URL hors `/login`
- **Constaté** : Connexion réussie. Toast "Connexion réussie" affiché en bas à droite. Redirect vers `/dashboard`. Profil "Coach Test" visible en bas de sidebar.
- **Statut** : `PASS`
- **Screenshot** : aucun (étape de transition)

### Étape 2 — Arrivée sur le tableau de bord

- **Actions** : Observation de la page post-login
- **Attendu** : Page de type dashboard affichée, URL hors `/login`
- **Constaté** : Route `/dashboard` chargée. Sidebar active sur l'entrée "Dashboard" (surlignée en bleu). Contenu principal en cours de chargement (spinner visible).
- **Statut** : `PASS`
- **Screenshot** : `tests/e2e/reports/screenshots/Étape 1+2 — Login et arrivée sur le tableau de bord-dashboard.png`

### Étape 3 — Navigation principale visible

- **Actions** : Assertion sur `role=navigation`
- **Attendu** : Nav visible avec au moins un élément identifiable
- **Constaté** : Sidebar complète rendue et visible, contenant : Dashboard, Athlètes, Programmes, Exercices, Recos, Plans, Support. Bouton "Inviter un client" visible en bas.
- **Statut** : `PASS`
- **Screenshot** : `tests/e2e/reports/screenshots/Étape 3 — Navigation principale visible-nav.png`

---

## Anomalies détectées

Aucune.

---

## Observations annexes

- **Obs #1** : Le contenu principal du Dashboard (zone droite) était encore en chargement (spinner) au moment du screenshot, sur les deux tests. Le login et la navigation s'affichent instantanément mais les données du dashboard se chargent de façon asynchrone. Non bloquant pour ce smoke test, mais à surveiller si un test futur doit asserter le contenu du dashboard — il faudra attendre la disparition du spinner.

- **Obs #2** : Durant la mise au point du test, deux sélecteurs ont raté avant de trouver le bon : (1) `getByLabel(/email/i)` sur `/` — la page racine est une landing page marketing, pas un formulaire de login. (2) `getByRole('button', { name: /se connecter/i })` — l'élément "Se connecter" est un `<a>` (link) et non un `<button>`. Le sélecteur final `getByRole('link', { name: /se connecter/i })` est correct et robuste.

## Dette de testabilité

- La sidebar ne semble pas avoir de `data-testid` sur ses entrées de navigation (Dashboard, Athlètes, Programmes…). Les tests futurs ciblant une entrée spécifique devront utiliser `getByRole('link', { name: /dashboard/i })` ou similaire — fragile si les labels changent. Recommandation : ajouter `data-testid="nav-dashboard"`, `data-testid="nav-athletes"`, etc. sur les liens de la sidebar.
- Le formulaire de login (champs email/password) n'était pas inspectable dans ce run — il s'est soumis sans erreur, mais on ne sait pas si les champs ont un `data-testid`. À vérifier lors d'un test dédié au flow de login.

## Artefacts du run

- **Rapport HTML Playwright** : `playwright-report/index.html`
- **Screenshots** : `tests/e2e/reports/screenshots/Étape 1+2 — Login et arrivée sur le tableau de bord-dashboard.png`, `tests/e2e/reports/screenshots/Étape 3 — Navigation principale visible-nav.png`
- **Traces** : aucune (tests passés)
- **Vidéos** : aucune (tests passés)

## Notes pour la suite

- La chaîne complète est validée. Le `loginAsPersona('coach')` est opérationnel pour tous les tests futurs.
- Prochain test suggéré : navigation vers chaque section de la sidebar (Athlètes, Programmes) pour valider le routing post-login.
- À terme, ajouter une assertion sur la disparition du spinner du dashboard pour garantir que les données se chargent bien.
