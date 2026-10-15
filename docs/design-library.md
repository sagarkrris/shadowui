# HLD and LLD design workbook

The public `/hld` and `/lld` catalogs contain twelve original worked problems each. Every listed problem has a statically generated workspace at `/{track}/{slug}`. This is the initial 24-problem library, not a claim to cover every possible interview problem or reproduce another site's 150-problem catalogs.

The reference interface informed the catalog → brief → diagram → insights workflow. Content and SVG diagrams are original; the implementation uses the existing InterviewIQ header and visual language. There is no account, payment gate, AI grading, external code runner or editable drawing canvas in this addition. Users can study reference diagrams, zoom/download them, and write their own practice notes.

The solution diagram is a complete board: functional requirements, non-functional/state contracts and capacity/design assumptions above the architecture; interfaces, data/ownership and decisions below it. Pastel cards and drawn outlines follow the supplied screenshot's visual structure. All authored text is retained with computed card heights, and SVG exports contain the board itself rather than an empty canvas. Written tabs remain available for comfortable reading. Desktop panels scroll independently; mobile panels stack.

## Behavior

- Catalogs combine text, topic, difficulty and completion/revisit filters. Empty results offer a reset.
- Workspaces show diagrams, written walkthroughs, interfaces/data ownership, failure checks and sources. LLD also shows a downloadable Java 17 core model.
- Solution tabs support arrow keys, Home and End. Diagrams include a textual relationship view and an independently scrollable region.
- At 700px and below, brief, solution and insight panels stack vertically. At intermediate widths, insights move below the first two panels.
- Notes, completion and revisit flags use `interviewiq:design-library:v1` in localStorage. Tracks and slugs isolate state. Unknown keys and malformed values are discarded, and notes are bounded to 20,000 characters. Storage events refresh other tabs. Concurrent edits to the same problem are last-writer-wins; there is no account or cloud synchronization.
- Storage write failure keeps current-page state usable and displays a warning; this in-memory fallback does not survive navigation/reload. Solution Markdown, diagram SVG, Java source and practice-note downloads provide explicit export paths.
- Public navigation, search metadata and the sitemap expose the catalogs and all 24 workspaces. No dependency was added.

## Independent semantic review

Reviewed the complete authored content separately from its UI implementation. HLD diagrams show named request/ownership relationships, not automatic bidirectional network connections. Bypass edges route around intermediate boxes. Descriptions and walkthroughs state where durability, atomicity, idempotency and authorization belong. Estimates distinguish average versus peak and raw data versus indexes/replicas. No estimate is represented as a benchmark.

Specific boundaries examined: expiry equality and stale cached deletion for links; atomic admission and outage behavior for quotas; per-conversation ordering and removed members for chat; ambiguous provider success and opt-out races for notifications; visibility rechecks for feeds; unpublished media versions for streaming; conflicting file versions and retained tombstones for sync; expired holds and late payment compensation for booking; balanced posting versus sufficient funds for ledgers; delete/update ordering for search; stale completion versus external effects for scheduling; assignment authority versus stale geo candidates for dispatch.

Primary references include HTTP RFC 9110, PostgreSQL explicit locking, Kafka delivery/order semantics and Java 17 collections contracts. These support underlying primitives; the worked architectures are bounded design proposals rather than vendor-endorsed complete applications. Diagram text and written steps remain the authority for simplified reference drawings.

The twelve Java classes are **standalone invariant models**, not complete implementations of the surrounding products. Each workspace states exactly what the class omits. They target the repository's established Java 17 teaching baseline. `test/designLibraryJava.test.mjs` compiles the exact published source with `--release 17`, executes each model's boundary fixture, and adds barrier-driven concurrent ownership checks for parking, lending, reservations, quotas and job leasing. Inputs, expiry equality, duplicates, invalid ownership, recency updates, terminal game states and arithmetic overflow are covered. Hardware, provider integrations, crash durability, multi-process execution and physical devices are not verified by these tests.

UI review includes local-state isolation, corrupt storage, unavailable storage, tabs, downloads, public navigation, each solution route and narrow layout. `e2e/design-library.spec.js` is registered in the full tech-blog gate because shared public navigation and search also serve the learning library. No tech-blog course or `javaRelease` declaration was added; the design-model fixtures run in the full unit suite.

Validation evidence is reported from the actual final gate and focused browser runs. A green gate does not establish complete infrastructure behavior, security certification, physical-device accessibility or zero bugs. No deployment or publishing is included.

## Answer audit — 2026-10-15

Reviewed all 24 answers, each board relationship, capacity estimate, interface/data contract, check list and the exact twelve published Java models. Cross-checked underlying primitives against Java 17 LinkedHashMap/Math documentation, PostgreSQL 17 explicit locking, Kafka 4.1 delivery semantics, RFC 9110 and RFC 6585 section 4. These references support primitives, not completeness of the proposed applications.

Corrections: parking tickets and library loans now carry per-session identity, preventing delayed releases from closing a later session for the same vehicle/member. Their teaching APIs now return Ticket/Loan (null means occupied), and release accepts that returned object. Callers of earlier downloaded examples must update to these signatures. Vending cancellation is terminal and returns money at most once. Feed inbox uniqueness is explicitly per reader/post; ticket inventory uses show/seat keys and callback confirmation verifies booking, amount, currency and every seat token. Video progress uses a server-ordered session epoch plus sequence; sequence alone cannot order different devices. Scheduler heartbeats/completions require a running job and an unexpired lease even before reclamation. The ride-race example now correctly has the driver accept competing offers. Rate limiting links directly to the standard defining 429.

Independent review coverage:

| Answers | Boundaries checked |
| --- | --- |
| URL shortener; distributed quota | Decimal capacity arithmetic, expiry equality, revocation, unique aliases, atomic refill/debit, regional overshoot |
| Chat; notifications | Commit-before-ack, duplicate identity, conversation order, membership, opt-out, unknown provider outcomes |
| Feed; autocomplete | Per-reader candidate identity, current visibility, cursor tie-breakers, delete versions, tenant cache scope |
| Video; file sync | Manifest publication, cross-session progress, chunk authorization, conflicting base versions, journal/tombstone retention |
| Booking; ledger | Show-scoped seat ownership, payment matching, expired callbacks, atomic balances, overflow, reversals |
| Scheduler; dispatch | Expired/stale attempts, external-effect deduplication, location epochs, offer expiry, driver/rider uniqueness |
| Parking; library | Same-owner reacquisition, stale release, one resource owner, null/invalid inputs, process-local session scope |
| Elevator; vending | Stop selection versus physical service, direction reversal, terminal cancellation, single refund/dispense, hardware uncertainty |
| Expenses; seat holds | Exact remainder allocation, overflow, payment precondition, expiry equality, stale generations, single-seat scope |
| LRU; rolling quota | Access-order mutation, eviction/update, rejected-call behavior, exact window boundary, bounded state |
| Job lease; notification router | Token/expiry completion, immutable registry wiring, unsupported channels and adapter-owned concurrency |
| Tic-tac-toe; logging | Invalid moves preserve state, all win lines/draw, terminal state, severity, CR/LF hygiene, explicit sink failure policy |

Executable regressions cover same-owner reacquisition in parking/lending, cancellation followed by attempted insert/dispense, concurrent cancel versus dispense, and completion exactly at lease expiry. HLD changes are architectural contract corrections reviewed by tracing concurrent state transitions; no database/provider implementation is claimed or tested. Scope omissions remain explicit (for example multi-seat transactions, persistence, physical hardware and vendor reconciliation). No further actionable answer defects were identified in this bounded audit; this is not proof against every possible production failure.
