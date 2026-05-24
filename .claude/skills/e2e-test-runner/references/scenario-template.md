# Scénario : <NOM_DU_FLOW>

> Ce document décrit le scénario avant l'écriture du code Playwright.
> L'utilisateur le valide avant que la skill génère le `.spec.ts`.

## Métadonnées

- **Flow** : <description courte, ex: "Coach crée un client puis lui assigne un programme">
- **Persona** : `coach` | `athlete` | `coach + athlete`
- **Viewport** : `desktop` | `mobile` | `both`
- **Date de génération** : <YYYY-MM-DD>
- **Priorité** : `critical` | `high` | `medium` | `low`

## Objectif

<Une phrase : ce que le test prouve si tout passe.>

## Préconditions

- L'app est accessible à `https://fit.from6agency.com/`
- Les comptes de test des personas concernés existent
- <toute autre précondition métier>

## Hors-périmètre

- <ce que le test ne couvre PAS volontairement, pour cadrer les attentes>

## Étapes

### Étape 1 — <nom court de l'étape>

**Actions** :
1. <action 1>
2. <action 2>

**Résultat attendu** :
- <ce qui doit être vrai après les actions>

**Assertions** :
- `<element>` doit être visible
- `URL` doit matcher `<pattern>`
- `<champ>` doit contenir `<valeur>`

**Screenshot checkpoint** : oui | non

---

### Étape 2 — <nom>

(même structure)

---

## Données de test utilisées

- **Persona email** : <référence à `personas.ts`>
- **Données saisies** : <client name, programme nom, etc.>

## Teardown

- <faut-il supprimer les données créées ? si oui, comment>
- <ou : "données laissées en place, cleanup périodique manuel">

## Anomalies anticipées / zones à risque

<Optionnel : si l'utilisateur ou la skill identifie des zones suspectes
à surveiller particulièrement, les lister ici. Ex: "Le compteur de reps
a un historique de bugs, vérifier qu'il ne se reset pas pendant l'étape 4.">
