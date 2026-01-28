# AGENTS.md — Bugfix Sprint Rules (Beanrate)

## Mission
We are in a stability sprint. Fix bugs/regressions only. Do not build new features.

## Primary goal
Make DEV and PROD behavior consistent, fix auth/session issues, and eliminate obvious UX-breaking bugs.

---

## Operating Mode (Full-Access Agent)
You may read/write files and run commands as needed, **but follow the safety rules below**:
- Prefer the smallest safe change that resolves the issue.
- Avoid broad refactors, reformatting, or “cleanup” work unrelated to the bug.
- If a task requires any “restricted action” (listed below), stop and request explicit approval.

---

## Setup / Commands
- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Build check (required): `npm run build`
- Lint (if available): `npm run lint`
- Tests (if available): `npm test`

---

## Critical Guardrails (Always On)

### 1) Secrets + Sensitive Data (Hard rules)
- **Never print, log, paste, or commit secrets** (API keys, tokens, cookies, session IDs, passwords).
- Do not echo environment variables (no `printenv`, `cat .env*`, etc.). If you must confirm an env var exists, say “present/missing” only.
- Never commit `.env*`, service keys, or credential files.
- If debugging requires auth artifacts (HAR/console logs), assume they may contain tokens and handle as sensitive.

### 2) Dev/Prod Safety (Hard rules)
- **Never touch Production Supabase** (data, schema, settings, keys) unless explicitly told.
- Never change Production-scoped Vercel env vars.
- Treat `main` as sacred; no direct commits/pushes to `main`.

### 3) Minimal Diff Discipline
- Prefer minimal diffs and targeted edits.
- Avoid sweeping changes:
  - no project-wide formatting
  - no dependency upgrades
  - no renaming/moving many files
- If a fix would touch **>5 files** or change core app architecture, stop and request approval.

### 4) Dependency Policy
- **Do not add or upgrade dependencies** without explicit approval.
- If a dependency is absolutely required for a fix, document:
  - why it’s required
  - alternatives considered
  - risk and rollback plan

### 5) Database / Migrations Policy
- **No schema changes, migrations, RLS policy changes, or seed scripts** unless explicitly requested.
- No destructive SQL. No `DROP`, mass updates, or data backfills without approval.

---

## Restricted Actions (Require explicit approval)
Stop and ask before doing any of the following:
- Changing Vercel/Supabase environment variables or project settings
- Any database schema/RLS/migration change
- Adding/upgrading dependencies
- Force pushing, rewriting git history, or `git reset --hard` on shared branches
- Deleting large file sets or running destructive shell commands
- Touching anything Production (Supabase PROD, prod keys, prod env vars)

---

## Command Safety Rules (Full-Access)
Do **not** run risky commands unless explicitly approved:
- `rm -rf`, `sudo rm`, recursive deletes
- `git push --force`, `git reset --hard`, `git clean -fd`
- `npx`/`curl`/scripts from unknown sources
- Any command that exports secrets to terminal output

When in doubt: choose a read-only command first (`ls`, `cat` of non-sensitive files, `git status`, `git diff`).

---

## Workflow (Bugfix Loop)
1. Reproduce the bug (use provided steps).
2. Identify root cause (not just symptoms).
3. Apply the smallest safe fix.
4. Run required checks:
   - `npm run build` (required)
   - `npm run lint` (if configured)
   - `npm test` (if configured)
5. Summarize:
   - Root cause
   - Fix applied
   - Files changed
   - Manual verification steps
   - Rollback steps

---

## Auth/Session Changes (Extra caution)
If you change **any** of these:
- cookies, session handling, redirect logic
- middleware, auth guards, token refresh
- Supabase auth client setup
Then you must include:
- Risk explanation (what could break)
- Exact verification checklist (DEV + PROD)
- Clear rollback instructions

---

## Git + Deployment Workflow (Codex)

### Allowed branches
- You may commit and push directly to `origin/dev` after checks pass.
- **Never push to `main`** under any circumstances.
- Do not create tags or releases.

### Required checks before any push
Run these and confirm success:
1) `npm run build`
2) `npm run lint` (if lint exists / is configured)

If either fails: do not commit or push. Fix the issue or stop and report the failure.

### Before committing
- Confirm you are on `dev`: `git branch --show-current`
- Show `git diff --stat`
- Briefly summarize what changed and why

### Commit rules
- Use a concise message: `Fix: <short description>`
- Keep diffs minimal; no refactors unless necessary for the bug.

### Push rules
- Push only to: `origin dev`
- Use: `git push origin dev`
- **No force push**.

### Rollback rules (preferred)
- Prefer `git revert <commit>` for rollback on shared branches.
- Avoid history rewrites.

---

## Output Format (What to report back)
Always provide:
- ✅ Root cause
- ✅ Fix applied
- ✅ Files changed (list)
- ✅ Commands run + results (build/lint/test)
- ✅ Manual verification steps
- ✅ Rollback steps
