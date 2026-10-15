# Verification

npm run check runs TypeScript/Vite production build and the Node regression suite. API tests use a private PGlite PostgreSQL engine with the same five-table shape and mocked AI fetches. They cover sessions, signup, tenant ownership, drafts/revisions, full checks, Vercel request grading, timeout records, history and logout without touching Supabase or using paid AI credits. The lightweight adapter does not simulate PostgreSQL advisory-lock concurrency.

Every v3 reference is run against its 40-case suite; every broken starter must fail at least one case. Independent expected-value regressions cover monetary rounding, webhook replay identity, atomic updates, refund ordering, projection gaps, namespace collisions and CSV injection. Existing archived oracle, memory/interrupt, watch-mode and input-mutation tests remain.

React tests exercise signup, random sessions, file tabs, adding files, saving, compact hidden counts, reasoning and submission. Proposal parsing tests cover explicit paths and unnamed blocks.

npm run test:browser runs a mock-API Chromium journey across all six UI references, interacting with the rendered controls and asserting parent-document isolation, aggregate result display and mobile horizontal overflow. Install its browser with npx playwright install chromium if needed. It does not claim cross-browser, screenshot-diff or production-network performance coverage.

UI grading tests controller state and semantic rendered HTML. The 750/2000 ms runtime budgets are workload limits, not guarantees about internet latency, bundle download speed or cold-start time. Static code metrics are advisory, not a line-count score.
