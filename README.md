# Agent Storage — Project Lab 3

AI-assisted engineering practice with 30 independent challenges, Supabase-backed accounts and attempts, timed submissions, isolated grading, and six live HTML/CSS/JavaScript previews.

## Upgrade the existing application

No SQL, new database, table reset, account recreation or new Vercel project is required. Keep the existing `.env`, `server/db.mjs`, Git repository and Vercel environment variables. Historical challenge definitions remain available for old attempts. New sessions draw from the v3 catalog; finish an existing active session before starting a new one.

To apply this release to your existing checkout, extract the supplied archive to a separate folder. From that extracted folder run PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY-UPGRADE.ps1 -ProjectPath "C:\Users\HP\Downloads\agentforge\agentforge"
```

The script backs up changed source files and copies only the paths in `upgrade-files.json`. It never copies `.env`, database files or `server/db.mjs`, and does not run SQL. It runs `npm ci` after copying because this version adds the HTML parser used by UI grading. Stop `npm run dev` before applying the update.

Alternatively, copy the files listed in `upgrade-files.json` manually into the existing project, then run `npm ci` there.

```powershell
npm run dev
```

Production builds are generated automatically by Vercel after a push. A code update still requires that normal build; the Supabase database does not need initialization.

## Verify and deploy

```powershell
npm run check
```

Tests use a local PostgreSQL-compatible engine and mocked AI responses. They do not write to your Supabase database or spend AI credits. Optional browser smoke tests need Chromium installed:

```powershell
npx playwright install chromium
npm run test:browser
```

After local checks, commit the changed source files and lockfile, then push to the same GitHub repository. The connected Vercel project redeploys automatically. Existing environment variables are reused. Never commit `.env`.

## Challenge bank

- Easy, 10 minutes: webhook replay protection, cursor pagination, download grants, invoice rounding, atomic transfers, recursive redaction, layered settings, redirect validation, seat-picker UI, approval-form UI.
- Medium, 20 minutes: refund reconciliation, stock leases, retry dispatch, versioned projection, feature targeting, batch loading, tagged-cache invalidation, spreadsheet exports, search-race UI, optimistic-board UI.
- Hard, 30 minutes: checkout integrity, authorization precedence, weighted admission, tenant LRU, weighted load balancing, release scheduling, tenant-safe RAG retrieval, event reconciliation, virtualized-grid UI, offline-profile conflict UI.

Each task has 40 checks: 2 public examples and 38 hidden cases, including workload cases. The score is passed cases / total, and all cases must pass for a passing assessment. Existing comments are context; the published release contract is authoritative. No extra prompts, fewer lines or intentionally misleading instructions earn points.

## Runtime and preview

Projects use `package.json` main and relative CommonJS imports. They may have up to 40 local `.js`, `.json`, `.html`, `.css` and `.md` files, totaling 120 KB. You can add files in the workspace. Markdown contracts are read-only in the editor; server-owned requirements do not change when candidate code changes.

UI projects contain a complete existing view, controller, stylesheet and shell. Run Preview loads the current code in an opaque-origin iframe with no network access. Expand opens a larger preview dialog. Preview errors and measured local render time appear inside it. The runtime supports native HTML/CSS/JavaScript and local CommonJS modules; it is not an npm/JSX bundler. Search and remote updates use explicit simulated events rather than live services.

Server grading executes candidate JavaScript inside QuickJS with 64 MB memory, 750 ms ordinary-case budgets and 2,000 ms workload budgets. UI checks compare state and semantic DOM, including ordering, disabled states, labels and safe text. Layout wrappers, CSS and button wording are not exact-match tests. This is not automated screenshot grading or proof of real-network loading speed. The preview timing is informational, not a score.

Full Check and final results show overall/hidden counts plus at most six public examples. Hidden inputs, assertions and individual case verdicts are omitted from new reports. The source repository contains developer-owned test oracles; a public repository is not a confidential examination system.

## AI assistant

Your existing API settings are preserved. Full-file responses should use a filename in the opening fence, e.g. three backticks followed by `js controllers/cart.js`. Headings and filename comments are also recognized. Unnamed blocks are marked unassigned. Every proposal opens a comparison dialog with an explicit target selector; nothing applies automatically. Repeated file proposals have separate block numbers so the user can choose a version.

AI adapter shape and file handling are tested with mocks. Live provider availability, balance and model access still depend on your configured provider; no paid AI request was made during this upgrade.

## Database and Vercel execution

Keep the working Supabase Session pooler URL (port 5432) with Postgres.js; do not switch it back to the shared Transaction pooler. Credentials are backend-only. `COOKIE_SECURE=true` remains appropriate on Vercel HTTPS. `DB_DEBUG=true` optionally enables parameter-free SQL diagnostics.

Locally a periodic sweep freezes overdue attempts. On Vercel, deadlines are checked on requests, and queued attempts are graded while their attempt/submission request is active. The grading transaction rolls back to queued if it cannot commit, allowing an attempt-page request to retry. There is no always-running background scheduler while all clients are closed. Session-mode database connection counts and platform limits remain relevant as traffic grows.

No database migration is part of this release.
