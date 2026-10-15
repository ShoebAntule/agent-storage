# Upgrade to Agent Storage — Senior Lab v2

## Preserve your working setup

1. Stop the running app with Ctrl+C.
2. Back up your existing project folder, including its `.env` and `data/` directory.
3. Replace the application source with this release. Keep your existing `.env` and `data/` in the new project root; they are intentionally not included in the returned archive.
4. Run `npm ci`, then `npm run check`.
5. Run `npm run dev`, or `npm run build` followed by `npm start`.
6. Refresh the browser. Complete any existing v1 attempt before starting a new v2 session.

No schema reset is needed. Existing accounts, sessions and attempts use the same SQLite tables and database path. Legacy challenge definitions remain server-side so older attempt history still resolves and old code retains its original contract. New assignments use only the 30 senior projects. Your Vyce `.env` settings do not need to change.

## What changed

- 10 service scenarios × 3 progressive tiers = 30 projects.
- Easy/medium/hard still receive 10/20/30 minutes; easy now means senior foundation, not beginner.
- Four-file starter workspace: `solution.js`, `service.js`, `policy.js`, and read-only `RELEASE.md`.
- Existing implementations contain inherited defects and incorrect legacy comments. Release requirements are authoritative. The platform does not instruct the AI to deliberately introduce defects.
- Each project has 40 checks: two visible examples, 10 explicit adversarial regressions, 26 seeded generated inputs, and two workload checks. Generated hidden cases are reproducible within an attempt and vary across attempts.
- Hidden results expose only `caseNumber`, a generic name, `hidden`, and `passed`. No input, expected value, actual value, failure category, exception text, or elapsed time is returned for hidden cases.
- **Full checks** runs the assessment without locking the attempt. Limited to two requests/minute/account. **Submit** or timeout still locks it.
- A new senior pass requires 40/40, not 60%. Partial numeric scores show progress; they do not represent a pass.
- 750 ms regular execution budget, 2,000 ms workload budget, 64 MB isolated runtime memory. Timings include setup/code execution and input/output conversion; machine speed can affect near-limit results.
- Static analysis reports source size/lines, function count, branch count, unreachable code, debugger statements and empty catches. These support review; code length itself is not graded. Direct dynamic eval/Function/import expressions are prohibited by contract and fail checks. Static checks are intentionally limited, not a complete security analyzer.
- Agent Storage logo, favicon and file icons.
- Retained the watch-mode worker-message fix and additionally prevented inherited command-line flags from breaking workers.
- JSON inputs are parsed as JSON inside the isolated runtime, preserving special own property keys safely.

## Important scope

These are executable, multi-file CommonJS service-logic projects, not full operating-system repositories with npm installation, HTTP servers, real databases, browser rendering or live model calls inside submissions. Local `require('./file.js')` resolves only submitted JS files; no package or filesystem access exists.

Measured workload budgets make inefficient solutions fail when they exceed the budget. They do not establish theoretical optimality or enforce arbitrary short code. Review checkpoints are recorded notes, not proof of human reasoning. A correct first-prompt AI solution remains valid; no fair evaluator can guarantee that all one-prompt solutions fail.

Tests and reference fixtures are absent from browser APIs and AI prompts, but visible to the source owner. This is a practice app, not a tamper-proof certification service. Dedicated execution isolation, calibration and broader abuse controls remain necessary before a public hostile-workload deployment.
