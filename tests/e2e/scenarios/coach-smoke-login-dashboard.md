# Scénario : Coach — Smoke test login + tableau de bord

> Ce document décrit le scénario avant l'écriture du code Playwright.
> L'utilisateur le valide avant que la skill génère le `.spec.ts`.

## Métadonnées

- **Flow** : Coach se connecte via magic link et arrive sur le tableau de bord avec navigation visible
- **Persona** : `coach`
- **Viewport** : `desktop`
- **Date de génération** : 2026-05-24
- **Priorité** : `critical`

## Objectif

Valider que la chaîne complète fonctionne : magic link → session active → tableau de bord chargé → navigation principale présente.

## Préconditions

- L'app est accessible à `https://fit.from6agency.com/`
- Le compte `test-coach@6way.test` existe avec un mot de passe valide
- Les variables `TEST_COACH_EMAIL` et `TEST_COACH_PASSWORD` sont renseignées dans `.env.test`

## Hors-périmètre

- Contenu métier du tableau de bord (widgets, données clients, statistiques)
- Fonctionnalités de navigation (on vérifie juste la présence, pas les liens)
- Comportement mobile

## Étapes

### Étape 1 — Accès à la page de login et soumission du magic link

**Actions** :
1. Naviguer vers `/`
2. Remplir le champ email avec `test-coach@6way.test`
3. Remplir le champ password
4. Cliquer le bouton de soumission

**Résultat attendu** :
- La session est active
- L'URL ne contient plus `/login` ni `/sign-in`

**Assertions** :
- `page.url()` ne matche pas `/login|sign-in/i`

**Screenshot checkpoint** : non (étape de transition)

---

### Étape 2 — Arrivée sur le tableau de bord

**Actions** :
1. (suite directe après reprise de pause)

**Résultat attendu** :
- Une page de type "dashboard" ou accueil coach est affichée
- L'URL indique une route post-login (ex: `/dashboard`, `/home`, `/coach`, ou `/`)

**Assertions** :
- `page.url()` ne matche pas `/login|sign-in/i`
- Au moins un élément de type heading ou contenu principal est visible

**Screenshot checkpoint** : oui

---

### Étape 3 — Navigation principale visible

**Actions** :
1. Observer la navigation (sidebar ou barre du bas ou header)

**Résultat attendu** :
- La navigation principale est rendue et visible (au moins un élément de nav)
- Aucun état d'erreur ni écran vide

**Assertions** :
- `nav` ou `role=navigation` est visible dans le DOM
- OU au moins un lien/bouton de navigation identifiable est visible

**Screenshot checkpoint** : oui

---

## Données de test utilisées

- **Persona email** : `PERSONAS.coach` → `test-coach@6way.test`
- **Données saisies** : aucune (smoke test, lecture seule)

## Teardown

- Aucun — le test ne crée pas de données. La session de test reste ouverte (pas de logout).

## Anomalies anticipées / zones à risque

- Les sélecteurs du formulaire login dépendent de l'UI Lovable — risque de sélecteur fragile si pas de `data-testid`. On utilisera `getByLabel` et `getByRole` en fallback.
- La navigation peut être une sidebar masquable ou un bottom nav mobile — vérifier sur desktop que la sidebar est bien visible sans action supplémentaire.
- Le redirect post-login peut atterrir sur une route inattendue (onboarding, etc.) — on assertera uniquement l'absence de `/login`.
