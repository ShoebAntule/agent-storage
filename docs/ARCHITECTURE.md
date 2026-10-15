# Architecture

React/Vite frontend → same-origin Node API → app_private PostgreSQL schema in Supabase. Postgres.js uses the existing Session pooler URL. Secrets remain backend environment variables.

Backend challenge definitions include developer-owned reference implementations and tests. publicChallenge strips those and gives candidates only their starter workspace, authoritative contract, two examples and public metadata. Old challenge versions remain available for historical attempts. New attempts use 30 independent v3 projects.

Candidate modules execute inside QuickJS in a Node worker, with host APIs absent, local import resolution, memory/stack limits and interrupts. Node owns input immutability checks, structural code diagnostics, comparison and scoring. UI results include controller state and rendered HTML, compared by semantic DOM rather than CSS or exact source. HTML parsing does not execute scripts.

Live preview uses a separate preview-host.html document in a sandbox=allow-scripts iframe without allow-same-origin. Its CSP blocks network requests and active resources. The parent sends only the candidate workspace runtime document; it never sends provider/database credentials. The child cannot read the parent document. There is no parent listener that accepts commands from candidate code.

Local grading uses the existing bounded queue and expiry sweep. Vercel freezes expired drafts on requests and grades the selected queued attempt while holding its row lock inside a transaction. Concurrent attempt-page requests cannot grade the same row simultaneously. If execution stops before commit, the row stays queued. No independent scheduler is configured for offline exact-deadline execution.

AI replies are proposals, not edits. The UI extracts filenames from opening fences, headings or leading comments. Unnamed blocks require a target selection. Review shows current/proposed contents and applies one chosen file only.
