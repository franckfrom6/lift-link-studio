# Batch Test Run Report

> ⚠️ Format figé — consommé en aval pour générer des prompts Lovable.
> Extension du rapport standard avec sections spécifiques au Mode B.

## Métadonnées

- **Mode** : `batch`
- **Source script** : `docs/testing/<script-name>.md`
- **Section(s)** : <numéros>
- **Tests en scope** : <count>
- **Categories incluses** : <auto, auto-with-precond, ...>
- **Spec exécutée** : `tests/e2e/<batch-spec>.spec.ts`
- **Persona** : `coach` | `athlete` | `coach + athlete`
- **Viewport** : `desktop` | `mobile`
- **Date** : <YYYY-MM-DD HH:MM>
- **Durée totale du run** : <Xs>
- **Verdict global** : `PASS` | `FAIL` | `PARTIAL`

## Préconditions exécutées

Pour chaque précondition lancée avant le batch :

### Précondition #1 — <nom>

- **Statut initial** : `already-met` | `setup-needed` | `setup-failed`
- **Actions effectuées** : <résumé si setup-needed, sinon "aucune">
- **État final** : `met` | `failed`
- **Durée** : <Xs>

Si une précondition échoue, le batch ne tourne pas. Le rapport s'arrête ici avec verdict `BLOCKED`.

## Synthèse du batch

- **Tests en scope** : <N>
- **Tests skipped** : <N> (détails section "Tests skipped")
- **Tests run** : <N>
- **PASS** : <N>
- **FAIL** : <N>
- **Anomalies bloquantes** : <N>
- **Anomalies majeures** : <N>
- **Anomalies mineures** : <N>

## Per-test verdict table

| Test ID | Catégorie | Statut | Résumé |
|---------|-----------|--------|--------|
| T-A-30 | auto-with-precond | ✅ PASS | Session loaded, first exercise active, timer started |
| T-A-31 | auto-with-precond | ❌ FAIL | Weight input vide, aucune suggestion affichée |
| T-A-32 | auto | ✅ PASS | Set logged successfully, next set became active |
| T-A-35 | auto-with-caveat | ⚠️ PASS-CAVEAT | Timer continued in background; full eviction not simulated |
| T-A-36 | manual-only | ⏭️ SKIPPED | iOS silent mode — non automatisable |
| T-A-39 | auto | ❌ FAIL (known bug) | Bouton "Ajouter une série" disabled après complétion |

## Tests skipped

Liste des tests en scope mais non exécutés, avec raison.

### T-A-36 — Rest timer silent mode (iOS)

- **Catégorie** : `manual-only`
- **Raison du skip** : Test physique iOS, non automatisable en Playwright
- **À tester manuellement sur** : iPhone réel, ringer switch off
- **Procédure manuelle** :
  1. Mettre l'iPhone en silent mode
  2. Démarrer une séance, laisser le rest timer arriver à 00:00
  3. Vérifier que le beep est audible

### T-A-101 — iOS PWA install + reopen

- **Catégorie** : `manual-only`
- **Raison du skip** : Installation PWA + cycle de vie iOS, non automatisable
- **À tester manuellement sur** : iPhone réel
- **Procédure manuelle** : <reprise depuis le script>

## Scénario déroulé — Détails des tests en échec

Pour chaque test FAIL, détail complet (les PASS et SKIPPED restent dans la table ci-dessus, pas besoin de les re-détailler).

### T-A-31 — Previous session weight suggestion

- **Catégorie** : `auto-with-precond`
- **Précondition liée** : `athlete-has-completed-session`
- **Persona** : athlete
- **Viewport** : mobile
- **Steps exécutés** :
  1. Login as athlete
  2. Navigate to active session
  3. Look at weight input for an exercise done in a previous session
- **Attendu** (depuis le script) : Weight input pre-filled with last logged weight OR a suggested weight badge shown (e.g., "52 kg")
- **Constaté** : Weight input à 0, aucun badge de suggestion
- **Watch-for matched** (depuis le script) : "All weight inputs at 0 with no suggestion, comparison arrows missing"
- **Reproductibilité** : 100% sur 1 run
- **Screenshot** : `tests/e2e/reports/screenshots/T-A-31-fail.png`
- **Trace Playwright** : `test-results/T-A-31/trace.zip`
- **Hypothèse root cause** : Probablement requête API pour `previous_weight` qui ne fait pas le bon JOIN sur `student_id` (à vérifier dans `useExerciseHistory` ou similaire)
- **Catégorie** : `bug app`

---

## Anomalies hors scope

Anomalies vues pendant le run mais qui ne correspondent pas à un test du script (bugs collatéraux). Pas attribuées à un T-A-NN, mais à reporter quand même.

### Anomalie HS-1 — Spinner persistant sur Progress après login

- **Sévérité** : `mineure`
- **Vu pendant** : exécution de T-A-30
- **Symptôme** : page Progress affiche un spinner pendant ~3s avant de charger les charts
- **Pas testé directement par le script mais à noter** : impact UX

## Observations annexes

Friction UX, lenteurs, comportements non-bloquants.

- <Liste>

## Dette de testabilité

Éléments manquant de `data-testid` ou difficiles à cibler proprement.

- <Liste des éléments concernés avec recommandation>

## Artefacts du run

- **Rapport HTML Playwright** : `playwright-report/index.html`
- **Screenshots** : `tests/e2e/reports/screenshots/`
- **Traces** : `test-results/*/trace.zip`
- **Vidéos** : `test-results/*/video.webm`
- **Registry mis à jour** : `docs/testing/test-registry.json`

## Recommandations pour la suite

Optionnel : suggestions structurées de prochains pas pour Claude Code en aval.

- **À prompter Lovable** : <liste de fixes prioritaires identifiés>
- **À retester** après un fix Lovable : <liste des tests qui devraient repasser>
- **À étendre** : <sections du script non encore couvertes mais critiques>
