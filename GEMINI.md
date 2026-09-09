# Project Workflow Rules

## Continuous Deployment (GitHub -> Vercel)
- **Automatic Push**: Whenever code changes, UI updates, Supabase schemas, or configurations are modified and validated in Antigravity, automatically stage, commit, and push them to `git push origin main`.
- **Vercel CI/CD**: Pushes to `main` automatically trigger a live Vercel production build and deployment.
- **Supabase Consistency**: Keep `supabase/schema.sql` synchronized with any database or model changes.
