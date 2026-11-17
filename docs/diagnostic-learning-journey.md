# Optional diagnostic and learning journey

`/diagnostic` samples one concept in each of five domains: Java/JVM reachability,
concurrent atomicity, Spring proxy transactions, DSA search invariants, and
ambiguous distributed outcomes. It uses deterministic option checks, with a
different comparable retest per domain. It does not score free text, infer lesson
completion, claim broad mastery, or predict hiring outcomes.

Each domain links an existing catalogue lesson, a specific exercise and the
applicable established roadmap. Existing Java/Spring authored banks and the
system-design retry lesson supply complete explanations; the DSA explanation
states sorted-order and constant-time access assumptions. The explanation
sections include examples, failure boundaries, verification, answered follow-ups
and primary references. These are conceptual scenarios; no new runnable Java
course or framework demonstration is introduced.

The ordered plan prioritizes failed retests, missed baseline concepts, unobserved
concepts, baseline-correct concepts, and retest-correct concepts. Every domain has
45 illustrative minutes: 15 learn, 20 exercise, 10 retest/explain. Selecting
15/30/60 minutes per study session changes the number of sessions without
changing the work estimate. A session can contain parts of adjacent domains.
These are adjustable planning assumptions, not time-to-mastery promises.

Progress is saved only through Save progress under `interviewiq.diagnostic.v1`.
Unknown formats are kept and saving is disabled until the user explicitly clears
this diagnostic. JSON export remains available when local saving fails. Clearing
the diagnostic does not remove notebook notes or other learning progress. The
optional notebook journey uses the existing normalized note schema, has a stable
ID, remains incomplete, and is discoverable by existing saved-learning search.

Semantic review: volatile does not make increment atomic; proxy self-invocation
does not independently trigger advice and may still run inside an outer
transaction; reachable cache entries remain retained; sorted order justifies
binary-search elimination; a lost response cannot prove a remote operation did
not commit. Local deduplication is explicitly distinguished from durable,
replica-wide protection. Retest success remains a second option-selection sample.

Focused verification: `node --test test/diagnostic.test.mjs` and
`e2e/diagnostic.spec.js` cover malformed/unknown data, skipped answers, finite
choices, retest priority, budget arithmetic, catalogue/rubric reuse, resume,
notebook handoff, export, mobile layout and storage failures. Record actual final
commands and results in the task report; the parent runs the mandatory final gate.
