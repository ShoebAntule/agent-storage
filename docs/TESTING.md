# Verification and local acceptance

Senior v2 verification: **67 automated tests passed**, plus production build/type checking, API integration, all 30×40 reference cases, malformed-starter regressions, strict hidden redaction, seeded-suite reproducibility, multi-file UI interactions, and watch-mode IPC regression. Dependency installation was also verified using `npm ci` from the lockfile.

## Automated verification

Run `npm run check` from the project root. It executes the production UI build/type check and Node test suites.

- **Grader:** 30 reference solutions across all authored cases, broken-starter regressions, exact difficulty/time distribution, strict all-case pass thresholds, hidden redaction and workload gates.
- **Isolation:** host API absence, loop interruption, memory-budget containment, hidden-error redaction.
- **API integration:** real Node server + real temporary SQLite database; signup/login/logout, duplicate account, password hashing, account isolation, Origin checks, configuration redaction, random filtered assignment, model selection, one active attempt, draft revisions, custom inputs, visible checks, immutable submission, persisted conversations and record history.
- **Deadline/recovery:** real backend sweep with no client connection, late code rejection, restart recovery and unchanged deadlines. Tests advance stored deadlines rather than waiting 10/20/30 minutes.
- **AI adapters:** OpenAI-compatible and Gemini JSON request/response flows use explicit mock provider responses. Provider HTTP failures and request caps are exercised. No real key or billed call is used.
- **UI interaction:** React rendered in jsdom, with a simulated API. Covers signup, easy difficulty selection, random session creation, file tabs, read-only release contract, editor/autosave, disconnected AI controls, full hidden checks, examples, review checkpoints, reasoning, submit confirmation and score report. This is a DOM interaction test, not a screenshot or real-browser layout test.

## Manual browser acceptance

1. `npm run dev`, open http://127.0.0.1:5173, create an account. Confirm validation for short passwords.
2. Start an easy session. Confirm ~10:00, random task, difficulty/category labels, and one active session. Try the same for medium (20:00) and hard (30:00) after completing each attempt.
3. Edit code, wait for **Saved**, refresh and resume from the dashboard. Confirm code and deadline persist.
4. Use **Full checks** and confirm 40 numbered results without hidden inputs; edit and rerun without locking the session. Then use **Run examples**, then change **Custom JSON input**. Inspect actual output and execution errors. Enter invalid JSON and confirm clear feedback without losing code.
5. Add a reasoning note, navigate back to the lab, and resume. Confirm it is saved.
6. Configure a real API key/model in `.env`, restart. Confirm the model selector. Ask for code, inspect the proposal, discard it once, then apply a later proposal. Ensure no automatic replacement.
7. Submit manually. Confirm the locked state, report score/check evidence, submitted code, reasoning, AI conversation and export.
8. For a real-time acceptance check, leave an easy attempt running until expiry; also test after closing the tab with a Saved draft. Reopen history and verify auto-submission.
9. Create another account. Confirm history is separate; direct access to the first account's attempt URL/API is rejected.
10. Stop/restart the backend; confirm records remain. For offline expiry, stop during an active session, let the deadline pass, restart and check automatic evaluation.
11. Test at desktop and narrow mobile widths, keyboard navigation, dialog focus/Escape and scroll behaviour. Check editor visibility and report readability.
12. Test `npm run build` + `npm start` at http://127.0.0.1:3001 to verify the deployment-style single-origin build.

## Verification limits

No real-browser visual inspection was available in the authoring environment. Responsive CSS and the simulated DOM journey were verified through build and interaction checks; complete the manual browser checks on your machine. Live provider availability, model permissions, billing and quotas require your credentials. Public deployment, external email, Supabase integration, full React component execution and a general-purpose OS sandbox are not included in this local release.

## Evaluator limitations

Finite curated tests do not prove universal correctness or absence of vulnerabilities. Security tasks enforce their specific documented contract. Runtime measurements include VM execution overhead and are not normalized benchmarks. The source includes reference fixtures for developers to inspect, so this is a practice system, not a locked-down certification platform.
