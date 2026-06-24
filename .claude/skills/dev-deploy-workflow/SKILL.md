---
name: dev-deploy-workflow
description: Enforce the dev → ship discipline for this Lovable + Supabase project (6way / lift-link-studio). Use this skill on EVERY development task — whenever code is written, edited, committed, pushed, or shipped to prod. It guarantees the branch convention, the "git push ≠ deploy" rule for Supabase edge functions, the PR-to-main flow, the post-merge verification step, and the project's code conventions. Trigger it for any request involving "dev", "fix", "implémente", "corrige", "déploie", "push", "en prod", "merge", "ship", editing edge functions / migrations / React code, or whenever you are about to commit. Apply proactively at the start of any coding task and before any push.
---

# Dev → Deploy Workflow — 6way (lift-link-studio)

This is a **Lovable** project (`project_id = wlwzxhihykefzbtvoqtm`) connected to **Supabase**.
There is **no CI** in the repo (no `.github/workflows/`). Deployment is handled entirely by Lovable on sync with `main`.

The single most important fact this skill exists to enforce:

> **Pushing to git does NOT deploy anything. Supabase edge functions and migrations only go live when changes reach `main` and Lovable re-syncs — and that re-sync must be VERIFIED, never assumed.**

Apply every section below on every dev task.

---

## 1. Branch discipline (non-negotiable)

- Develop on the designated feature branch: **`claude/f6gym-review-fixes-qxITe`** (create locally if missing).
- **NEVER push to another branch** without explicit user permission. Especially never push directly to `main`.
- `git push -u origin <branch>`. On network failure only, retry with exponential backoff (2s, 4s, 8s, 16s).
- Commit messages: clear, descriptive, in the imperative. End with the required Co-Authored-By / Claude-Session trailers. **Never** put the model identifier in commits, PR bodies, or any pushed artifact.

## 2. Two tracks of change — know which one you're touching

| Change type | How it ships | Who edits it |
|---|---|---|
| **Edge Functions** (`supabase/functions/**`) | Lovable redeploys on sync to `main` — **must verify** | Edit directly in repo ✅ |
| **SQL migrations** (`supabase/migrations/**`) | Lovable runs on sync to `main` — **must verify** | Edit directly in repo ✅ |
| **JSON / i18n** (`src/i18n/**`, config) | Bundled with front build | Edit directly in repo ✅ |
| **Complex React/TS** (pages, components, hooks) | Front rebuild on sync to `main` | Prefer a **Lovable prompt** in `testing/PXX-*.txt`; direct edits OK for small, surgical changes |

When a change is large or architecturally significant React/TS, write a Lovable prompt (`testing/PXX-<slug>-prompt.txt`) rather than editing directly, so Lovable stays the source of truth for the front.

## 3. Shipping to prod — the standard path

The simplest reliable path (what the user wants by default):

1. Commit + push to the feature branch.
2. **Create a PR → `main`** (use `mcp__github__create_pull_request`). Do NOT create a PR unless shipping is the goal, and never merge it yourself without permission.
3. User clicks **Merge**. Lovable re-syncs and redeploys: front **+** edge functions **+** migrations.

## 4. Post-merge verification (the step everyone forgets)

After a merge that touched **edge functions or migrations**, the job is NOT done until deployment is confirmed:

- Tell the user explicitly: *"if X still fails with the same error after merge, the edge function was not redeployed."*
- If it does fail, the fix is to **force a redeploy of the edge functions** (Lovable redeploy, or `supabase functions deploy <name>` if CLI access exists) — not another code change.
- Never report "fixed in prod" off the back of a git push or even a merge alone. State plainly what is pushed vs. merged vs. verified live.

## 5. Code conventions (carry into every edit)

- **Non-blocking errors** (cleanup, notifications, fire-and-forget emails) → `console.error` only. **Never** a user-facing toast.
- **Prefix logs** by surface, e.g. `[LiveSession]`, `[admin-create-user]`.
- **Profiles are auto-created by a trigger** (`on_auth_user_created`, migration `20260623063610`). Any code that creates a profile must `upsert({ onConflict: "user_id" })`, never `insert` — a plain insert hits a UNIQUE violation and returns a 400.
- **CORS `allowedOrigins`** in edge functions must include the prod domains: `https://6way.app` and `https://app.6way.app`. Don't drop them.
- **`SENDER_DOMAIN` / `FROM_DOMAIN`** must match the subdomain delegated to Lovable's email nameservers. **Do not change them before DNS is verified** — a mismatch causes "No email domain record found".
- **Do not change the main upsert flow of `saveSetsForExercise`** — it is correct.
- **Transactional emails**: templates live in `supabase/functions/_shared/transactional-email-templates/`, must be registered in `registry.ts`, and a fixed recipient is set via the template's `to` field.

## 6. Default closing move

After pushing or opening a PR, offer to **watch the PR** (`subscribe_pr_activity`) for CI / review comments and autofix — but only act on PR events per the harness rules (investigate, fix unambiguous issues, ask via AskUserQuestion when ambiguous).

---

## Quick checklist (run mentally before every push)

- [ ] On `claude/f6gym-review-fixes-qxITe`, not `main`?
- [ ] Did I touch edge functions / migrations? → flag the verify-after-merge step.
- [ ] Non-blocking errors are `console.error`, not toasts?
- [ ] Profile creation uses `upsert`, not `insert`?
- [ ] CORS / SENDER_DOMAIN untouched (or DNS-verified)?
- [ ] Commit trailers present, model id absent?
- [ ] Shipping? → PR to `main`, let the user merge, then verify.
