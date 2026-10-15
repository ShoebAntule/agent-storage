# Apply Project Lab 3 in place

Use APPLY-UPGRADE.ps1 and the source manifest from the root README. It preserves `.env`, `server/db.mjs`, your Git checkout, Supabase tables, accounts, attempts and Vercel environment variables. No SQL is required.

The 30 v3 project IDs are new. Old definitions are retained so old attempt records render against the same release contract. Existing active attempts remain old; complete one before starting a v3 session. Scores are not recalculated retroactively.

Changed files include the challenge catalog and formatted project sources, nested-module runtime, semantic UI grader, browser preview host, editor, assistant proposal parser, compact results, production CSP routing, dependency lockfile and regression tests. See upgrade-files.json for exact paths.

After npm ci and npm run check, commit the updated files and push to the existing GitHub repository. Vercel rebuilds the same application automatically; database setup is not repeated.
