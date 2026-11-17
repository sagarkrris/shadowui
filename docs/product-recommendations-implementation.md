# Product recommendation implementation

This extends the previous site-audit fixes. Changes are local source; deployment,
real provider calibration and hosted sandbox acceptance are separate operations.

## Implemented application capabilities

- Optional `/diagnostic` baseline samples five domains. Skipped questions stay
  unobserved; explanations, lesson/exercise links, different retests and a
  time-budget plan connect learning to practice. Saving/exporting is explicit.
- `/progress` describes saved answer evidence and coverage. Improvements require
  fresh answers with matching question, difficulty, round, rubric, actual model,
  prompt, question hash and assessment-settings hash. Historical and disputed
  records remain distinguishable. These are device-held records, not certification.
- `/share/readiness` identifies URL-supplied checklist values as unverified,
  rejects invalid percentages and does not advertise them as verified assessments.
  Existing preparation composites are labelled heuristics, not offer probabilities.
- The content inventory distinguishes courses, collections, guides, question banks,
  canonical coding problems, labs and challenges. `/capabilities` describes access
  and configuration requirements; editorial provenance exposes source revisions
  and honest review/verification status. Identity remains InterviewIQ at ElevatePrep.
- `/privacy` documents local/account storage, actual token and audit policies,
  provider submissions, export/deletion limits, optional measurements and the
  owner-provided support address, sgrkrishna23@gmail.com.
- Cloud writes are bound to the signed-in account. A previous account's or unowned legacy device
  work requires a one-time explicit import decision (including guest drafts). Selecting a cloud copy reconciles
  durable caches as well as mounted React state. Logout/deletion discard mounted
  workspaces after confirmed success. See account-security-verification.md.

## Optional learning analytics

Product events are off until explicit browser opt-in. The automatic Vercel
SpeedInsights component has been removed; hosting/service logs remain separate.
The API stores a closed event shape in the existing PostgreSQL pool, with hashed
browser identifiers and no account ID, answer/profile fields or query strings.
Collection requires `PRODUCT_ANALYTICS_ENABLED=true` and a configured database;
no storage failure receives a successful persistence receipt.

Repeated event IDs are idempotent. Deletion and collection serialize per browser;
a hashed withdrawal marker suppresses late events for the retention window. The
UI rereads preferences and preserves a newer identifier chosen in another tab.
Consent identifiers are excluded from backups. Clearing browser storage can lose
the identifier needed to delete earlier pseudonymous rows; delete measurements
first if server deletion is desired. Revoking consent stops future collection.

Configure `PRODUCT_ANALYTICS_RETENTION_DAYS` (default 30, bounded 1–365).
Schedule daily pruning with:

```sh
node scripts/operations/product-analytics.mjs --prune
```

Expired rows are excluded from reports even before pruning. Idle deployments
still need the scheduled job for physical deletion; no cron has been deployed.
Operator-only aggregate reporting (requires DATABASE_URL; outputs no browser IDs):

```sh
node scripts/operations/product-analytics.mjs
```

Reports include completion actions, practice/save/AI failures, comparable-retest
signals, latency and observed-browser return cohorts. Day-30 reporting requires
at least 31 days of retention. Cohorts start at first observation in the retained
window, not lifetime acquisition. Reports are capped at 100,000 rows and disclose
truncation. Self-reported actions, opt-in coverage and client-generated events do
not establish learning, unique people, or causal product impact.

## Verification and operational boundaries

- Unit/browser regressions cover evidence comparability, invalid share values,
  blocked storage, consent, deletion races, data minimization, diagnostic journeys,
  cross-account choices, content inventory and provenance.
- `scripts/security/verify-account-isolation.mjs` uses actual handlers, persistence
  and an isolated PostgreSQL schema. Follow its explicit loopback opt-in contract.
- `scripts/validation/check-product-analytics.mjs` verifies persistence across pool
  restart, duplicate delivery, cross-browser deletion isolation, late-event
  suppression and retention using a separate disposable PostgreSQL schema.
- Follow operational-verification.md for configuration-only preflight and explicit
  dedicated-runner checks. No arbitrary code runs on the web application host.
- AI calibration fixtures are synthetic and await independent expert review.
  Live calibration remains explicit opt-in; offline output is not model quality
  evidence. No real-provider request was made for this implementation.

The final source must pass the full `npm run verify:tech-blog` gate, which includes
these browser regressions, plus the documented real PostgreSQL checks. The chat
completion report records actual results; configuration alone is not live evidence.
