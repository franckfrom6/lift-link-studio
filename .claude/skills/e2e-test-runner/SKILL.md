---
name: e2e-test-runner
description: Generate, execute, and report on end-to-end tests for the coaching app using Playwright. Use this skill whenever the user wants to test a user flow, validate a feature, run E2E tests, check that something works after a change, verify a parcours utilisateur, test a parcours coach or athlete, run a test script, exercise a test section, or generate a bug report after testing. Trigger this skill for any request involving "teste", "test E2E", "vérifie le parcours", "lance un scénario", "valide cette feature", "QA", "déroule la section X du script", "exécute le cahier de test", or whenever a user describes a flow they want exercised against the running app. Also use proactively after major changes to suggest a test run.
---

# E2E Test Runner — Coaching App

Generates Playwright tests targeted at user flows, runs them against `https://fit.from6agency.com/`, and produces structured reports consumable for downstream Lovable prompt generation.

Supports two operating modes:

- **Mode A — Ad-hoc scenario** : user describes a flow in natural language → skill produces a scenario doc → spec → run → report (workflow original).
- **Mode B — Batch from script** : user points to a section of a long-format test script (`docs/testing/*-test-script.md`) → skill parses, classifies, orchestrates preconditions, runs, reports.

The same artifact format (report, screenshots, etc.) is used in both modes.

## When to use this skill

- User wants to test a feature, flow, or parcours (coach or athlete)
- User asks to validate behavior after a Lovable update
- User mentions QA, end-to-end, scenarios, regression, smoke test
- User references a test script or one of its sections (e.g. "déroule la section 3 du script athlete")
- User describes a sequence of actions and asks "ça marche ?"

## Routing — Mode A vs Mode B

Apply this decision in order:

1. **The user references a test script section or test ID** (e.g. "T-A-30", "Section 3 athlete", "athlete-test-script.md") → **Mode B**.
2. **The user describes a flow in natural language**, no script referenced → **Mode A**.
3. **Ambiguous** → ask one clarifying question before guessing.

---

# Mode A — Ad-hoc scenario (workflow original)

Used for quick smoke tests, regression checks on a specific flow, or any one-off testing need not yet captured in a script.

## Workflow

1. **Capture the scope** — what flow, which persona, which viewport
2. **Generate the scenario** — `tests/e2e/scenarios/<flow-name>.md` following `references/scenario-template.md`. Show to user, get green light.
3. **Generate the Playwright spec** — `tests/e2e/<flow-name>.spec.ts` following `references/playwright-conventions.md`
4. **Run the tests** — `npx playwright test ...`
5. **Produce the report** — `tests/e2e/reports/<flow-name>-<YYYY-MM-DD-HHMM>.md` following `references/report-template.md`

See `references/scenario-template.md` and `references/report-template.md` for templates.

---

# Mode B — Batch from test script

Used when the user wants to exercise a section of one of the long-format scripts in `docs/testing/`.

## Workflow overview

```
Parse script section
        ↓
Classify each test (auto / auto-with-precond / auto-ai-flaky / auto-with-caveat / manual-only)
        ↓
Update test-registry.json
        ↓
Identify required preconditions (coach state for athlete tests)
        ↓
Generate precondition spec(s) if missing
        ↓
Generate batch spec from in-scope tests
        ↓
Run preconditions → run batch → produce segmented report
```

Read these three reference files **before** doing anything in Mode B:

- `references/test-script-parsing.md` — how to read the MD scripts
- `references/test-classification.md` — classification rules
- `references/orchestration-coach-athlete.md` — precondition handling

## Step 1 — Confirm scope with user

Before parsing, confirm:

- **Which script** : `coach-test-script.md` or `athlete-test-script.md`
- **Which section(s)** : section numbers (e.g. "Section 3" = T-A-30 to T-A-46)
- **Which viewport** : `desktop`, `mobile`, or `both`
- **Test categories included** : by default, include `auto` and `auto-with-precond`. Exclude `manual-only` (will be listed in report as deferred). Ask before including `auto-ai-flaky` or `auto-with-caveat`.

If the user provided this already, parse it directly — don't re-ask.

## Step 2 — Parse and classify

Follow `references/test-script-parsing.md` to extract each test. Apply rules from `references/test-classification.md` to assign a category to each.

Write or update `docs/testing/test-registry.json` with the new/updated entries. This file is committed to Git — it's the audit trail of how tests are categorized.

## Step 3 — Identify and prepare preconditions

Follow `references/orchestration-coach-athlete.md`.

For athlete tests with category `auto-with-precond`, identify the coach actions required and generate (or reuse) a precondition spec at `tests/e2e/preconditions/<name>.spec.ts`. These specs must be **idempotent**: check first, create only if missing. Never delete data.

## Step 4 — Generate batch spec

Generate one spec per (script, section, viewport) combination at `tests/e2e/<script-name>-section-<N>-<viewport>.spec.ts`. Include only in-scope tests. Tests not in scope (manual-only, deferred) appear as `test.skip(...)` with a comment referencing why.

Use `references/playwright-conventions.md` for selector and pattern guidance.

## Step 5 — Run

Run preconditions first, then the batch:

```bash
npx playwright test tests/e2e/preconditions/ --project=desktop
npx playwright test tests/e2e/<batch-spec> --project=<viewport>
```

Preconditions always run desktop (coach UI is desktop-primary). The batch viewport follows the user's choice.

## Step 6 — Segmented report

Report goes to `tests/e2e/reports/<script-name>-section-<N>-<viewport>-<YYYY-MM-DD-HHMM>.md` following `references/batch-report-template.md`.

The batch report extends the standard report format with three additional sections:

- **Preconditions executed** : what setup ran, outcome
- **Tests skipped** : list of tests in scope but skipped (manual-only, deferred AI), with the reason for each
- **Per-test verdict table** : `T-A-XX | PASS/FAIL | one-line summary`

After writing the report, surface to user with verdict, anomaly count, and report path.

---

# Common rules (both modes)

## Distinguishing test bugs from app bugs

When a test fails, before reporting it as an app bug:

1. Re-read the source (scenario or script entry) — is the expected behavior actually what the app should do?
2. Check the selector — element missing (app bug) or selector brittle (test bug)?
3. Check timing — race condition in the test? Add explicit wait, rerun once.
4. Still failing → app bug. Report it.

In the report's "Hypothèse root cause" field, state which category applies.

## Anti-patterns

- ❌ Generating a spec before scenario/script is parsed and validated
- ❌ Brittle selectors (Tailwind classes, deep CSS paths, `nth-child`)
- ❌ Hardcoded test data inline — use fixtures
- ❌ Skipping classification for "obvious" tests in Mode B
- ❌ Reporting a test framework issue as an app bug
- ❌ Bundling multiple unrelated flows in one spec file
- ❌ **Destructive operations in preconditions** (DELETE, truncate). Preconditions are idempotent. Always.

## Reference files

**Setup and conventions (both modes)** :
- `references/setup.md` — first-time Playwright installation
- `references/playwright-conventions.md` — selectors, fixtures, viewport, auth helper
- `references/report-template.md` — Mode A report format
- `references/magic-link-roadmap.md` — superseded by email/password auth, kept for record

**Mode A** :
- `references/scenario-template.md` — ad-hoc scenario doc format

**Mode B** :
- `references/test-script-parsing.md` — how to read `docs/testing/*-test-script.md`
- `references/test-classification.md` — classification rules and examples
- `references/orchestration-coach-athlete.md` — coach precondition setup for athlete tests
- `references/batch-report-template.md` — Mode B report format
