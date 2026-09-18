# Public reading and trust experience

The public root is now a reading homepage. The existing practice page lives at `/practice`, uses the same local persistence keys, and remains reachable through the prominent resume link. Existing `/?workspace=...` links redirect to `/practice` with the query preserved; `java-digest` maps to the Java Digest workspace. Password and OAuth sign-in return to practice. No saved drafts are migrated or deleted.

## Content and controls

- Editorial promise: “Understand Java and backend failures through working examples.”
- Three reading paths connect existing articles to investigations, with prerequisites and estimated times.
- Article controls provide within-article section search, individual code copying, browser-local bookmarks, and deterministic section URLs. Clipboard failures expose selectable text. Controls need JavaScript; article content remains server-rendered.
- Existing article authorship is retained. Named reviewers are explicitly unassigned, unknown update dates stay unknown, and runtime verification is not inferred from an article's title or review date.
- The public correction log records the actual detective scroll failure and its fix in source, without claiming deployment or hardware validation. New reports enter a private moderation queue before publication.

## Shared reader board

Uses the existing PostgreSQL pool (`DATABASE_URL`) and a signed anonymous browser cookie (`SESSION_SECRET`). Tables are initialized on first board use. Published topics and aggregate votes are public; pending requests/corrections, browser identifiers, and receipt IDs are not listed publicly. Anonymous voting is unique per topic/browser cookie, not per person. Resetting cookies can defeat that limit; the UI states this. The existing distributed rate limiter is reused; configure its Redis backend for shared limits across instances.

Before enabling publicly, assign a moderator and retention policy. Moderation is an operator task, not an unauthenticated API:

- Inspect pending records in `interviewiq_reader_requests` using your existing authenticated database tooling. Do not include raw private reports in logs.
- For a topic approved for publication, edit/redact its text and change only that record's status from `pending` to `published` using a parameterized statement and its UUID. Correction reports are never published automatically as request topics.
- When a correction is verified, add its public summary to `PUBLIC_CORRECTIONS` in `lib/readerEditorial.mjs`, with affected URL, status, date, resolution, and validation limits. Do not publish the reporter's identity or private evidence.
- Delete rejected/private reports according to the declared retention policy; purge anonymous cookies/votes when that policy requires it. No moderator identity or deletion schedule is invented by this patch.

When the DB or signing secret is missing, the board explains that submissions/voting are unavailable and shows clearly labeled editorial suggestions without fabricated live counts. Database errors do not become success acknowledgements. This task does not provision a database or run a production migration.

## Digest adapter

`/digest` is a preview issue and an explicit opt-in form. The form is unavailable unless `DIGEST_SUBSCRIPTION_WEBHOOK`, `DIGEST_SUBSCRIPTION_TOKEN`, and `DIGEST_POSTAL_ADDRESS` are configured. No account email is enrolled automatically and no subscription list is stored in browser storage.

The HTTPS adapter receives `{ email, consent: true, consentVersion, frequency: "weekly", consentedAt, source, postalAddress }` with a bearer token. It must:

1. Persist consent evidence and send a confirmation message, without subscribing an unconfirmed address.
2. Respond successfully with `{ "status": "pending_confirmation" }`, including for safe, idempotent repeat requests.
3. Own the confirmation, unsubscribe, suppression, deletion, and delivery lifecycle. Every weekly issue needs an unsubscribe link and the real sender details.
4. Send only the promised explanation/challenge/takeaway issue to confirmed addresses. No delivery scheduler is created here.

Do not configure this adapter until the provider meets that contract. The existing authentication email provider is not automatically used for marketing. No emails, invitations, or digest issues were sent during implementation. The preview makes no claim of an established weekly publishing streak. The existing RSS feed remains available independently.

## Usability study

`docs/usability/five-developer-study.md` contains a recruitment draft, consent script, four unguided tasks, observation criteria, and a synthesis template. `observations.csv` is deliberately empty. Five real developer sessions still require participants and have not happened.

## Validation and remaining operational work

Verification completed on 2026-09-18: all 544 unit tests passed, along with 42 production browser checks across Chromium, Firefox, and WebKit and 20 Chromium practice/account regression checks (62 browser checks total). ESLint, the production build, and `git diff --check` passed. Browser viewport coverage does not constitute physical-device testing.

The unit suite covers reading-path integrity, bookmark URL validation, signed voter cookies, input limits, origin checks, moderation acknowledgements, unavailable services, rate limiting, explicit digest consent, and provider confirmation semantics. Browser checks use controlled API responses for votes, moderation, and subscription confirmation; no live email or production database is exercised.

The production build is used for browser verification (`E2E_PRODUCTION=1`), avoiding a development-server JSON-manifest race observed during simultaneous cold-page loads. Public article native scrolling, tutorial scroll ownership, article-to-article navigation, link restoration, local bookmarks, code copying, search, accessibility, saved practice, and legacy workspace redirects are covered across Chromium, Firefox, and WebKit.

Operational work still required: configure and verify the shared database and rate-limit service in the deployment, choose a moderator and retention policy, validate a double-opt-in email provider and sender details before enabling email signup, and conduct the five real developer sessions. No site deployment is performed by this task.
