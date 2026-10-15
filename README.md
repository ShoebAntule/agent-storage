# Agent Storage — Senior Engineering Lab v2

A local-first, full-stack practice application for AI-assisted coding interviews.

**React + TypeScript · Node.js 24 · SQLite · QuickJS/WASM**

30 senior multi-file service projects, randomized sessions, authentication, an optional AI copilot, server-enforced timers, automatic submission, hidden checks, score reports, and saved attempt history. No database subscription, local LLM, Docker, or paid API is required for the non-AI workflow.

**Upgrading your existing project? Read [docs/UPGRADE.md](docs/UPGRADE.md) first. Keep your `.env` and database.**

## 1. Run locally

Install **Node.js 24 LTS** (includes npm), then extract this project. Open a terminal inside `agentforge`:

```bash
npm ci
```

Create the environment file:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Start the application:

```bash
npm run dev
```

Open **http://127.0.0.1:5173**. The API runs at **http://127.0.0.1:3001**. Use the same hostname consistently; localhost and 127.0.0.1 have separate cookies. Create an account with an email-shaped address and a password of at least 10 characters. Email delivery is not needed for local accounts.

The database is created automatically at `data/agentforge.sqlite`. You do not need Supabase or MongoDB credentials. Stop with Ctrl+C. Restarting preserves accounts, sessions, drafts, submissions, reports, and messages.

For a production-build local test:

```bash
npm run build
npm start
```

Open **http://127.0.0.1:3001**. This serves the built React application and API from one process.

## 2. Where to put the API key

Open **`.env` in the project root**, beside `package.json`. Never put a real key in `src/`, a browser form, the README, or Git. `.env` and local database files are ignored by Git.

### Gemini

Create a Gemini API key in Google AI Studio: https://aistudio.google.com/apikey

```dotenv
AI_PROVIDER=gemini
AI_API_KEY=replace_with_your_real_key
AI_MODEL=replace_with_a_model_id_available_to_your_account
AI_MODELS=
```

Use an actual text-generation model ID from your account's current documentation/dashboard, without a `models/` prefix. Free availability and quotas depend on the model and account. The app does not enable billing.

### Vyce AI or another OpenAI-compatible provider

```dotenv
AI_PROVIDER=openai-compatible
AI_API_KEY=replace_with_your_real_key
AI_BASE_URL=https://YOUR-PROVIDER-API-BASE/v1
AI_MODEL=your-default-model-id
AI_MODELS=your-default-model-id,another-allowed-model-id
```

Replace the entire AI_BASE_URL with the **documented API base URL**, not the website dashboard or `/chat/completions` endpoint. The server appends `/chat/completions`. For Vyce, confirm the base URL and permitted model IDs in your dashboard or API documentation. Do not use the example URL literally.

One key/provider can expose several configured models in the session selector. Providers are configured by the app owner, not arbitrary users. Each attempt records its selected model; switching providers happens in `.env` between sessions. Configured model IDs must actually be supported by that provider.

### Direct DeepSeek API (optional, paid)

```dotenv
AI_PROVIDER=openai-compatible
AI_API_KEY=replace_with_your_deepseek_api_key
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=replace_with_current_supported_model_id
AI_MODELS=
```

Restart the backend after editing `.env`. With `npm run dev`, stop the terminal process and run it again. Successful configuration appears on the dashboard; actual provider connectivity is verified only by sending a request. Failed requests still consume an attempt request slot. AI suggestions are never applied automatically: **Review proposed code → Apply replacement**.

Without a key/model, the application deliberately disables AI messaging. It does not fabricate responses or pretend to have an AI connection. Editing, custom runs, tests, timers, submissions and reports remain available.

Provider integration references:
- Gemini key security: https://ai.google.dev/gemini-api/docs/api-key
- Vyce compatibility statement: https://vyceai.com/company
- DeepSeek API: https://api-docs.deepseek.com/

## 3. Practice flow

1. Sign up or sign in.
2. Choose **Easy (10 minutes)**, **Medium (20 minutes)**, or **Hard (30 minutes)**.
3. Optionally choose a category and configured model. There is no challenge picker.
4. Enter the lab. A random unseen matching challenge is preferred; repeats become possible after exhausting that filtered pool. One active attempt per account.
5. Read the contract. Inspect the existing files and edit the exported service implementation in `service.js`; `solution.js` is the entry point. Use your AI assistant if configured.
6. Run visible examples, supply your own JSON input, or use **Full checks** to see numbered hidden verdicts without locking your attempt.
7. Add assumptions, verification and trade-offs under **Your reasoning**.
8. Submit manually, or let the timer expire. Review the report and export your record.

### Timer and saved work

The server stores the start and deadline. Refreshing or changing the client clock does not extend it. Drafts autosave after 600 ms of idle typing. The server scans expired attempts every second and submits the **latest persisted draft**, even if the tab is closed. It cannot submit keystrokes that never reached the server: watch the Saved indicator. The browser warns before closing with unsaved edits. Manual submission saves the current draft first.

If the server itself is stopped, no grading runs while it is offline. On restart, expired attempts are queued and interrupted evaluation jobs are recovered. The deadline does not move. Stale draft writes from another tab are rejected using a revision number; reload to restore the authoritative state.

### Scope of the execution environment

Each senior challenge is a four-file CommonJS project. `solution.js` exports a synchronous JSON-in/JSON-out function; `service.js` contains an inherited implementation to repair or extend; `policy.js` identifies the release stage; `RELEASE.md` is a read-only contract. Local require() resolves only submitted JS files. No external imports, host/network/filesystem APIs, JSX, npm installation, real payments, HTTP server processes or live model calls inside submissions are available.

The existing service is intentionally defective; source comments can be outdated and contradict the explicit release contract. Stage 2 and 3 introduce additional engineering constraints. A candidate must inspect and test all affected files, not just implement the headline request.

## 4. Strict evaluation

Each new project has **40 checks: 2 visible, 38 hidden**. Hidden checks include explicit adversarial regressions, seeded generated sequences and two workload cases. A senior pass requires **40/40** and no prohibited dynamic evaluation. Score is the rounded percentage of passed cases. Legacy v1 attempts retain their original scoring for compatibility.

The browser receives hidden case numbers and pass/fail only. No hidden inputs, expected or actual outputs, raw exceptions, categories or per-case timings are returned. The same redacted structure is stored and exported. Source owners can still inspect developer fixtures locally.

Full checks are available during an active attempt at two runs/minute/account. They do not lock the workspace. Submit or deadline expiry locks the latest saved submission and generates its final report.

Execution limits: **750 ms regular case, 2,000 ms workload case, 64 MB isolated runtime memory**. Input/output conversion and compilation contribute to the measured budget. Maximum documented workload is 4,000 records/events, or 500 pipeline jobs. These are per-case limits, not normalized CPU scores. A different machine may need calibration before public use.

AST-based code review reports source bytes/lines, functions, branches, unreachable statements, empty catches and debugger statements. Direct dynamic evaluation/import is prohibited. Other findings are advisory. We do not reward short code, extra prompts, checklist completion or explanation length.

A correct first-attempt AI solution can pass. Hidden tests check requirements, not whether someone used enough prompts. No finite suite proves absence of vulnerabilities or universal optimality.

## 5. Verify the project

```bash
npm run check
```

This type-checks and builds the UI, then runs the tests. Test coverage includes:

- All 30 reference solutions pass every authored case.
- Every broken starter fails at least one case.
- Password hashing, account/session behaviour, ownership checks and logout.
- Difficulty durations, filtered random assignment and one active attempt.
- Draft revision conflicts and immutable submissions.
- Hidden-test redaction and mandatory security gates.
- Automatic submission without a connected client and recovery after restart.
- AI request recording, model selection, explicit code ownership and request caps using a mock provider (no billed calls).
- Execution limits, infinite loops, memory exhaustion and absence of host APIs.

See `docs/TESTING.md` for manual browser acceptance checks and verification limits. Real Gemini/Vyce credentials are not included or live-tested.

## 6. Source map

```text
src/main.tsx                  React interface and typed API client
src/style.css                 Responsive design system
server/index.mjs              HTTP API, accounts, sessions, SQLite, job queue, AI adapters
server/challenges.mjs         Senior catalogue and public metadata
server/scenarios.mjs          Service contracts and developer oracles
server/edges.mjs              Explicit adversarial regressions
server/suites.mjs             Seeded hidden-case and workload generation
server/workspace.mjs          CommonJS workspace packaging/execution
server/quality.mjs            Structural code-review analysis
server/legacy-challenges.mjs  Original definitions for old attempt history
server/evaluate.mjs           Weighted grading and worker lifecycle
server/runner-worker.mjs      Isolated QuickJS/WASM execution
scripts/dev.mjs               Cross-platform development process launcher
tests/                        Grader and integration tests
docs/ARCHITECTURE.md           System and data design
docs/CHALLENGES.md             Challenge inventory
docs/TESTING.md                Manual acceptance checklist and test status
.env.example                  Configuration template (no secrets)
```

Server-side reference solutions are developer fixtures used to validate the grader. They are not exposed by an API. Because you own the local source, you can inspect them; this app is for deliberate practice, not a tamper-proof certification environment.

## 7. Troubleshooting

| Symptom | Action |
|---|---|
| `node:sqlite` not found | Install Node.js 24 LTS and reopen the terminal. |
| Port already in use | Stop the existing process. For the API change PORT in `.env` and the Vite proxy target together. |
| AI unavailable | Set AI_API_KEY and AI_MODEL, confirm provider/base URL, then restart. |
| Provider HTTP 401/403 | Verify key and account/model access in the provider dashboard. |
| Provider HTTP 429 | Check quota/balance; wait or use the non-AI workflow. |
| Draft revision conflict | Reload the attempt; avoid editing one attempt in two tabs. |
| Timer expired while offline | Last saved draft is authoritative. Open history after reconnecting. |
| Forgot local password | No reset service is included. Use another local account; resetting the database deletes all records. |

## 8. Deployment later

This handoff is local-only as requested. Before public deployment, choose hosting with a persistent writable volume (SQLite) or migrate the repository layer to PostgreSQL/Supabase. An ephemeral serverless filesystem is not suitable for this database.

Public deployment also requires HTTPS with `COOKIE_SECURE=true`, a single-writer or coordinated job queue design, stronger account/IP usage controls, backup/retention policies, and a dedicated execution-service boundary appropriate to hostile traffic. QuickJS has no host APIs and execution limits, but the worker is not an OS container or a claim of absolute isolation. Keep packages patched. Do not expose the development server publicly.

Keep paid AI use disabled unless you intend to fund it. Per-attempt caps are not global monetary caps: a public service needs daily/global budgets or user-supplied keys with a deliberate secret-management design.

## Portfolio description

After you run and understand the application, you can accurately describe it as:

> Built a full-stack AI-assisted coding practice platform with 30 versioned challenges, randomized timed sessions, session-based authentication, persisted attempts, an optional multi-model API adapter, and isolated JavaScript evaluation with strict numbered hidden checks, adversarial regressions, workload gates and structural review diagnostics.

Do not claim public users, production deployment, comprehensive security scanning, or unmeasured performance improvements.
