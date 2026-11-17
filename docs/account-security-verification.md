# Account security verification

This document records local implementation checks, not a production penetration
test or a guarantee of complete security. No real accounts, production endpoints,
credentials, answers, or database contents are used by the integration harness.

## Reproducible real database check

Use a disposable local PostgreSQL database and Node 24. The command intentionally
requires both an opt-in and a separate test URL; it does not load `.env` or reuse
`DATABASE_URL`. Only loopback database URLs are accepted. PostgreSQL must permit
creation/deletion of a schema in that database.

```sh
ACCOUNT_SECURITY_INTEGRATION=1 \
ACCOUNT_SECURITY_DATABASE_URL=postgres://security_test@127.0.0.1:55432/postgres \
node scripts/security/verify-account-isolation.mjs
```

The harness creates a random `account_security_*` schema, sets its own connection
search path and encryption key, creates two synthetic users, and removes its
schema in `finally`. It disables email, Redis and metric adapters and rejects
outbound HTTP. Connection strings, passwords and tokens are not printed. Failed
setup exits nonzero; refusing a missing opt-in or remote target exits 2 rather
than reporting a skipped test as a pass.

It executes the actual auth, state and account handlers with request/response
transport objects, actual session and CSRF verification, real parameterized SQL,
encryption and PostgreSQL foreign keys. Neither the authenticated identity nor
the data-isolation queries are mocked. This verifies handler/persistence behavior,
not Next's HTTP routing, reverse-proxy configuration or browser cookie delivery.

The 48 assertions cover credentials, public user fields, independent state and
revision conflicts, forged/missing account identifiers, missing/foreign CSRF,
anonymous/expired/revoked/logout sessions, state/export no-store headers,
production cookie attributes, hash-only token storage, encrypted state, CSRF
rotation, single-use/expired verification and reset links, password-reset session
revocation, invalidation of all outstanding reset links, session-bound export and
delete, cascading state/session deletion, and preservation of the other user.
Credential rate limiting and its separate bootstrap allowance also execute.
These rate checks exercise the local fallback; they do not validate Redis.

Local evidence on 2026-11-17: PostgreSQL 16.11, real database harness passed
48 assertions. Focused `accountSecurity`, `serverPersistence`, and
`requestSecurity` unit suites passed 12 tests. Browser account-choice regressions
are in `e2e/account-isolation-client.spec.js`; their API responses are mocked and
must not be cited as proof of server isolation.

## Account transition behavior

Cloud reads return `userId`; cloud writes now require the authenticated user's
`userId` in the request body as well as session-bound CSRF and the expected
revision. A missing or different ID fails closed with 409. This intentionally
stops older clients from writing until refreshed. A tab whose cookie has changed
cannot write a queued snapshot for its previous account into the new account.
Client hydration rejects responses naming a different signed-in account.

The browser records the last cloud owner in `interviewiq.cloudStateOwner.v1`.
When existing private work or profile data has no trusted local owner marker,
or belongs to another account, even an empty cloud account requires a one-time
cloud/device choice. Keeping the device copy explicitly imports it, including
guest drafts and legacy browser data. Discarding it reconciles private device
caches before applying the selected cloud copy. The owner marker is local bookkeeping, not an authorization control;
server authorization always comes from the session. Disabled or manually cleared
browser storage limits ownership history; the server still enforces session and
request ownership.

Successful sign-out and account deletion attempt to clear app-prefixed localStorage and
sessionStorage keys, then navigate to `/practice` to discard in-memory state.
Unrelated browser storage is preserved. Failed operations preserve device data.
Downloaded backups remain on the device and are outside browser cleanup.
Other open tabs can still display already-loaded data; their later writes are
blocked when their session expires or their account binding no longer matches.

Account deletion removes the user and cascaded sessions/state/recovery tokens.
Audit records use `ON DELETE SET NULL`: their email/IP fields can remain until
the configured retention pruning runs. Provider logs, email and database backups
are outside this application's deletion verification. Audit retention uses the
shared policy default of 90 days, bounded to 7–3650 days; pruning must be scheduled
operationally.

## Remaining deployment verification

Verify HTTPS/Secure cookie delivery through the real host, proxy trust and client
IP header overwrites, independent-browser sign-in/out and recovery links,
production database permissions/migrations, scheduled retention and backups,
and Redis-backed limits and outage behavior in an authorized staging deployment.
Forwarded client-address headers must come from a trusted proxy. The local
fallback rate limiter is process-local and cannot enforce a fleet-wide budget.
Email/OAuth provider behavior, external account identities and backup purging
are not established by this suite. No production testing or deployment occurred.

Blocked browser storage does not prevent navigation after server-confirmed logout/deletion. If browser policy refuses local cleanup, use its site-data controls before sharing the browser profile.
