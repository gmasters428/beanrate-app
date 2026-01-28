# Your Softgen App

# BeanRate

This is the source code for the BeanRate coffee rating app.

## Dev automation

Local setup (create `.env.local` in project root):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DEV_SMOKE_EMAIL=...
DEV_SMOKE_PASSWORD=...
```

Commands:
- `npm run smoke:dev` — signs in and verifies profile + ratings fetch
- `npm run preflight` — lint + build + smoke

CI (PRs to `dev`):
- Workflow: `.github/workflows/dev-automation.yml`
- Required repo secrets:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DEV_SMOKE_EMAIL`
  - `DEV_SMOKE_PASSWORD`

> **License & Usage**
>
> This repository is public to support deployment and tooling (e.g., SoftGen, Vercel).
> It is **not open-source**. All rights reserved.  
> Please do not reuse, redistribute, or commercialize this code without explicit written permission from the author.
