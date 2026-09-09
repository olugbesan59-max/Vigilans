# Automatic Deployment Rule

Whenever changes, features, bug fixes, or schema updates are made in Antigravity:
1. Ensure the build passes (`npm run build` in `client`).
2. Automatically commit the changes with a clear, concise message.
3. Automatically push the commit to GitHub (`git push origin main`).
   - Pushing to GitHub `main` automatically triggers Vercel to build and deploy the latest version to production.
4. If Supabase migrations or schema changes are involved, keep `supabase/schema.sql` updated and push the database definitions alongside the application code.
