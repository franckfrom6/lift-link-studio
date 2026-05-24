---
name: e2e-test-runner
description: Generate, execute, and report on end-to-end tests for the coaching app using Playwright. Use this skill whenever the user wants to test a user flow, validate a feature, run E2E tests, check that something works after a change, verify a parcours utilisateur, test a parcours coach or athlete, or generate a bug report after testing. Trigger this skill for any request involving "teste", "test E2E", "vérifie le parcours", "lance un scénario", "valide cette feature", "QA", or whenever a user describes a flow they want exercised against the running app. Also use proactively after major changes to suggest a test run.
---

# E2E Test Runner — Coaching App

Generates Playwright tests targeted at specific user flows, runs them against the live app at `https://fit.from6agency.com/`, and produces a structured report ready to be consumed for Lovable prompt generation.

## When to use this skill

- User wants to test a feature, flow, or parcours (coach or athlete)
- User asks to validate behavior after a Lovable update
- User mentions QA, end-to-end, scenarios, regression, smoke test
- User describes a sequence of actions and asks "ça marche ?"

## High-level workflow

1. **Capture the scope** — what flow, which persona, which viewport
2. **Generate the scenario** — a structured plan before any code is written
3. **Generate the Playwright spec** — TypeScript file under `tests/e2e/`
4. **Run the tests** — `npx playwright test` with the right config
5. **Produce the report** — structured Markdown, ready for downstream prompt generation

Do these steps in order. Don't skip the scenario step — the user reviews and adjusts before code gets written.

## Step 1 — Capture the scope

Before writing anything, confirm with the user:

- **Flow to test**: what user action(s) — e.g. "coach creates a client and assigns a program"
- **Persona**: `coach` or `athlete` (sometimes both, sequentially)
- **Viewport**: `desktop`, `mobile`, or `both`
- **Starting state**: fresh login, or assume an existing state? (default: fresh login each run)
- **Out-of-scope**: anything the user explicitly doesn't want exercised

If the user already provided this in a structured brief (e.g. generated from another Claude session), parse it directly — don't re-ask.

## Step 2 — Generate the scenario document

Before generating code, write a scenario in `tests/e2e/scenarios/<flow-name>.md` following the template in `references/scenario-template.md`. Show it to the user and get a green light before moving to code.

The scenario document contains:
- Metadata (flow name, persona, viewport, date)
- Preconditions
- Step-by-step actions with expected results
- Assertions (what must be true at each checkpoint)
- Teardown notes

Keep scenarios focused — one user goal per scenario file. Multi-persona flows (coach → athlete) get split into two linked scenarios.

## Step 3 — Generate the Playwright spec

Read `references/playwright-conventions.md` for the project-specific conventions (selectors, fixtures, viewport handling, login). Generate the spec file as `tests/e2e/<flow-name>.spec.ts`.

Key constraints:
- TypeScript only
- Use `data-testid` selectors when available; fall back to role-based selectors (`getByRole`, `getByLabel`). Avoid CSS class selectors — Tailwind classes change too often.
- Each `test()` block maps to one scenario step group from the scenario doc
- Use `test.describe.configure({ mode: 'serial' })` when steps depend on each other
- Screenshots on every assertion failure and at key checkpoints (use `await page.screenshot({ path: ... })`)
- For mobile, use Playwright's `devices['iPhone 13']` or set viewport explicitly per the conventions doc

**Login** uses email + password. Call `loginAsPersona(page, 'coach' | 'athlete')` — credentials are loaded automatically from `.env.test` via dotenv. No manual intervention required. See `references/playwright-conventions.md` for the full pattern.

## Step 4 — Run the tests

Run from the project root:

```bash
npx playwright test tests/e2e/<flow-name>.spec.ts --reporter=list,html
```

For mobile viewport:
```bash
npx playwright test tests/e2e/<flow-name>.spec.ts --project=mobile
```

For both:
```bash
npx playwright test tests/e2e/<flow-name>.spec.ts --project=desktop --project=mobile
```

If Playwright isn't yet installed in the project, run the setup procedure in `references/setup.md` first.

Capture the run output. Don't try to fix failing tests on the first pass — failures are the signal, not noise. If the test itself looks broken (selector wrong, race condition), distinguish that from an actual app bug in the report.

## Step 5 — Produce the report

Generate the report at `tests/e2e/reports/<flow-name>-<YYYY-MM-DD-HHMM>.md` following `references/report-template.md`. The format is fixed because it's consumed downstream to generate Lovable prompts — don't deviate.

Key sections (must all be present, even if empty):
- Test Run Report (metadata)
- Scénario déroulé (step-by-step with attendu vs constaté)
- Anomalies détectées (numbered, each with steps to reproduce)
- Observations annexes (non-blocking friction)

After writing the report, surface it to the user with:
1. A one-line verdict (`PASS` / `FAIL` / `PARTIAL`)
2. The count of anomalies by severity (if any)
3. The path to the full report file
4. The path to the Playwright HTML report (`playwright-report/index.html`) if useful

Don't summarize the anomalies inline unless the user asks — the report file is the canonical artifact.

## Distinguishing test bugs from app bugs

When a test fails, before reporting it as an app bug:

1. Re-read the scenario doc — is the expected behavior actually what the app should do, or did we mis-spec?
2. Check the selector — did it miss because the element isn't there (app bug) or because the selector is brittle (test bug)?
3. Check timing — race condition in the test? Add an explicit wait and rerun once.
4. If still failing, it's an app bug. Report it.

In the report's "Hypothèse root cause" field, explicitly state which category applies.

## Anti-patterns to avoid

- ❌ Writing the Playwright spec before the scenario doc is approved
- ❌ Using brittle selectors (Tailwind classes, deep CSS paths, `nth-child`)
- ❌ Hardcoding test data inline — use fixtures from `tests/e2e/fixtures/`
- ❌ Skipping the scenario document for "quick tests" — there are no quick tests; the doc is what the user reviews
- ❌ Reporting a test framework issue as an app bug
- ❌ Bundling multiple unrelated flows in one spec file

## Reference files

- `references/setup.md` — First-time Playwright installation in the project
- `references/playwright-conventions.md` — Selector strategy, fixtures, viewport, login (email+password)
- `references/scenario-template.md` — Template for Step 2
- `references/report-template.md` — Template for Step 5
- `references/magic-link-roadmap.md` — ⚠️ OBSOLÈTE — magic link remplacé par email+password
