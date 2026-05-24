# Test Run Report

> ⚠️ Format figé — consommé en aval pour générer des prompts Lovable.
> Ne pas modifier la structure sans coordination.

## Métadonnées

- **Scope** : <flow testé, ex: "Coach — Création client + assignation programme">
- **Scénario source** : `tests/e2e/scenarios/<flow-name>.md`
- **Spec exécutée** : `tests/e2e/<flow-name>.spec.ts`
- **Persona(s)** : `coach` | `athlete` | `coach + athlete`
- **Viewport(s)** : `desktop` | `mobile` | `both`
- **Date** : <YYYY-MM-DD HH:MM>
- **Durée totale du run** : <Xs>
- **Verdict** : `PASS` | `FAIL` | `PARTIAL`

## Synthèse

- **Étapes total** : <N>
- **Étapes passées** : <N>
- **Étapes échouées** : <N>
- **Anomalies bloquantes** : <N>
- **Anomalies non-bloquantes** : <N>
- **Observations UX** : <N>

## Scénario déroulé

### Étape 1 — <nom>

- **Actions** : <résumé>
- **Attendu** : <ce qui aurait dû se passer>
- **Constaté** : <ce qui s'est passé>
- **Statut** : `PASS` | `FAIL`
- **Screenshot** : <chemin si capturé>

### Étape 2 — <nom>

(même structure)

---

## Anomalies détectées

### Anomalie #1 — <titre court>

- **Sévérité** : `bloquante` | `majeure` | `mineure`
- **Étape** : <n°>
- **Persona** : <coach | athlete>
- **Viewport** : <desktop | mobile>
- **Symptôme observé** : <description précise de ce que Claude a vu>
- **Comportement attendu** : <ce qui aurait dû se passer>
- **Steps to reproduce** :
  1. <étape 1 reproductible>
  2. <étape 2>
  3. <étape n>
- **Reproductibilité** : `100%` | `intermittent` | `non reproduit après retry`
- **Screenshot** : <chemin>
- **Trace Playwright** : <chemin si pertinent>
- **Hypothèse root cause** (optionnel) : <si évident depuis le comportement>
- **Catégorie** : `bug app` | `bug test` | `ambigu`

### Anomalie #2 — <titre>

(même structure)

---

## Observations annexes

Friction UX, lenteurs, comportements bizarres mais non bloquants.
Pas d'impact fonctionnel mais à remonter pour amélioration.

- **Obs #1** : <description>
- **Obs #2** : <description>

## Dette de testabilité

Éléments manquant de `data-testid` ou difficiles à cibler proprement,
qui forcent l'utilisation de sélecteurs fragiles. À fixer côté app pour
améliorer la robustesse des tests futurs.

- <Liste des éléments concernés>

## Artefacts du run

- **Rapport HTML Playwright** : `playwright-report/index.html`
- **Screenshots** : `tests/e2e/reports/screenshots/<flow>-*.png`
- **Traces** : `test-results/<flow>-*/trace.zip` (si échec)
- **Vidéos** : `test-results/<flow>-*/video.webm` (si échec)

## Notes pour la suite

<Optionnel : recommandations de la skill sur ce qui mériterait
d'être testé en plus, ou ce qui doit être revérifié après fix.>
