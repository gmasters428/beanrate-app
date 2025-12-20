# AGENTS.md — Bugfix Sprint Rules (Beanrate)

## Mission
We are in a stability sprint. Fix bugs/regressions only. Do not build new features.

## Primary goal
Make DEV and PROD behavior consistent, fix auth/session issues, and eliminate obvious UX-breaking bugs.

## Setup / Commands
- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Build check (required): `npm run build`
- Lint (if available): `npm run lint`
- Tests (if available): `npm test`

## Guardrails
- Prefer minimal diffs. Avoid refactors unless necessary for the fix.
- Do not add new dependencies without asking first.
- Do not change database schema/migrations unless explicitly requested.
- Never touch production credentials, production Supabase, or production environment variables.
- If you change auth/session/cookies/redirects: explain the risk and how to verify.

## Workflow
1. Reproduce the bug (use provided steps).
2. Identify root cause (not just symptoms).
3. Apply the smallest safe fix.
4. Run `npm run build` (and lint/tests if present).
5. Summarize:
   - Root cause
   - Fix applied
   - Files changed
   - Manual verification steps

## Git + Deployment Workflow (Codex)

### Allowed branches
- You may commit and push directly to `origin/dev` after checks pass.
- Never push to `main` under any circumstances.
- Do not create tags or releases.

### Required checks before any push
Run these and confirm success:
1) `npm run build`
2) `npm run lint` (if lint exists / is configured)

If either fails: do not commit or push. Fix the issue or stop and report the failure.

### Before pushing
- Show `git diff --stat`
- Briefly summarize what changed and why

### Commit rules
- Use a concise message: `Fix: <short description>`
- Keep diffs minimal; no refactors unless necessary for the bug.

### Push rules
- Push only to: `origin dev`
- Use: `git push origin dev`
