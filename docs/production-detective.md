# Production Detective

Five public, statically generated investigations at `/detective`:

- `/detective/the-vanishing-map-entry`
- `/detective/the-rollback-that-never-happened`
- `/detective/the-service-that-drowned-in-retries`
- `/detective/the-cost-of-a-faster-query`
- `/detective/the-report-from-another-tenant`

Each contains three evidence files, competing diagnoses, repair choices with immediate feedback, a debrief, trade-offs, a local experiment, official references, and a review date. No account or AI service is involved. The full explanation is server-rendered in a native spoiler disclosure and remains readable with JavaScript disabled. The interaction requires JavaScript. Content and all measurements are fictional; this is learning material, not a scored certification. Learners can read the explanation at any point, so completion is not a measure of unaided correctness.

## Discovery and sharing

Links appear in the product tour, practice home, and Scenario Bank. Case URLs are included in the sitemap and existing RSS feed. The feed announces published content without promising a weekly release or collecting email addresses. Each case has a canonical URL and spoiler-free social metadata. Copying a challenge adds only `?via=share`; no choices, progress, user IDs, or result scores are shared. Clipboard failures show a selectable URL instead of claiming success.

The wider optional feature list (standalone code-review challenges, decision labs, migration guides, and an email digest) remains future scope. This release implements the recommended first milestone: five Production Detective cases, with prediction, interactive models, and illustrated flows inside their experiments.

## Progress and failure behavior

`interviewiq.detective.v1.<slug>` stores inspected clue IDs, diagnosis, fix, and completion in localStorage. Stored data is normalized against the published case before use. Invalid choices cannot unlock later phases. Saving occurs on user actions after hydration; no mount effect overwrites saved progress. Storage failure is visible and does not prevent the current in-memory investigation. Progress is browser-local, not account-synchronized. The existing full backup includes these namespaced keys. Concurrent tabs are not synchronized; each tab saves its own last action.

## Measurements

Events use the existing `/api/analytics` allowlist and `product.*` metrics pipeline. Event values contain only a published case slug; the existing analytics session ID identifies a tab session. The latest 2,000 product events remain in the browser's existing local journal. No evidence contents, identity details, or answers are sent.

| Event | Meaning |
| --- | --- |
| `detective_viewed` | First view of this case in a tab session |
| `detective_started` | First evidence inspection for an empty investigation |
| `detective_completed` | User confirms a supported diagnosis and repair |
| `detective_returned` | First view in a new tab session on a later UTC date than the last local view of that case |
| `detective_shared` | Clipboard write succeeded; this is a copied link, not proof of a sent share |
| `detective_share_visit` | First case view in a tab session arrived with `via=share` |

`summarizeDetectiveEvents(events)` counts distinct case/session pairs, including same-session completion rate. Resumed completions in another session count as completions but not conversions of a same-session start. These are browser/session measurements, not distinct people or authenticated cohorts. Storage clearing, blocked analytics, copied sessionStorage in duplicated tabs, and forged query parameters limit attribution. Returning in the same continuously open tab does not count as a later-day return.

For durable aggregate measurements, configure the existing `METRICS_WEBHOOK_URL` (and optional token). Without a destination, backend counters are process-local and browser journals are local; this patch does not provision an analytics service. Do not publish population-level retention claims from these local counters.

## Verification

- Unit coverage: content integrity, saved-state validation, retry boundaries, index workload extremes, tenant key collisions, and metric aggregation.
- Browser coverage: all five complete flows and experiments; incorrect choices; reload/resume; share referral and clipboard denial; malformed and unwritable storage; JavaScript-disabled explanations; canonical metadata; unknown-case 404; sitemap/RSS inclusion; mobile keyboard navigation and automated accessibility checks.
- `npm run test:release` includes the detective browser suite in Chromium, Firefox, and WebKit, alongside the existing practice release gate.
- Java fixture: compile `scripts/validation/fixtures/DetectiveMapCase.java` with `javac --release 17 -d /tmp/detective-java` after creating the output directory, then run `java -cp /tmp/detective-java DetectiveMapCase`. Expected output: `null`, `1`, `Stable-key repair: PASS`.
- Spring's trace, retry calculator, PostgreSQL work-unit chart, and cache replay are explicitly labeled teaching models. No Spring container or PostgreSQL benchmark is claimed. Live Gemini calibration remains skipped as requested.

Content lives in `lib/productionDetective.mjs`; published slugs are permanent. When correcting a case, update its explanation, relevant regression checks, and review date together. Retain IDs for compatible edits or version/migrate saved state when changing the solution structure.
