# Build a small Java dependency-injection container

Public URL: `/build/java-dependency-injection`, linked from the reader homepage, reading paths, and sitemap. Four chapters introduce registration, recursive constructor injection, singleton caching, and active-path cycle detection. Each includes a requirement, explanation, editable Java scaffold, downloadable `Main.java` with assertions, reference solution, prediction prompt, and the next limitation. A final transfer exercise relates construction to build graphs.

Live execution remains deferred by user choice. The browser never executes editor contents or submits them to a server. The fixed dependency-graph model is labeled separately and runs only repository-authored JavaScript with bounded recursion. No passing Java result or completion badge is inferred from model output. Downloads include the actual current draft; learners run `javac Main.java` then `java Main` locally. Use a different directory per chapter.

Drafts are stored under `interviewiq.tinyContainer.v1`, bounded to 20,000 characters per chapter. Storage failures are visible; downloads still work. Chapter anchors are permanent links. Reference implementations use Java 8 APIs/language and were compiled with `javac --release 8` and executed using OpenJDK 21.0.9. This does not certify runtime execution on a Java 8 JVM.

The educational implementation is single-threaded. Registrations replace prior mappings but do not rebuild existing dependents. Configure registrations before resolving objects. It deliberately omits qualifiers, scopes, proxies, lifecycle ownership/disposal, generic type keys, component scanning, and concurrent construction. Do not use it as an application framework.

Validation:
- `node --test test/tinyContainer.test.mjs`: deterministic model behavior and download validation.
- `node scripts/validation/check-tiny-container.mjs`: compiles all scaffolds/reference implementations, verifies each scaffold fails and each reference passes the real Java assertions. This script is only for trusted repository fixtures, never a service endpoint.
- `e2e/tiny-container.spec.js`: public discovery, saved edits after reload, actual download content, graph options, chapter anchors, and scrolling at phone/tablet/desktop widths.

Verified September 18, 2026: 547 unit tests passed; all four Java reference implementations passed and all four scaffolds failed as intended; 15 browser checks passed across Chromium, Firefox, and WebKit at 390, 412, 768, and 1440 pixels. ESLint, production build, and diff whitespace checks passed. Physical devices and live sandbox execution were not tested. No deployment was performed.

## Learning continuity

Chapter checkpoints collect a prediction and confidence before showing feedback. Incorrect predictions at 95% confidence appear in a revisit list; this is a reflection aid, not a statistical calibration score. Answers and progress persist separately from the original draft key under `interviewiq.tinyContainer.learning.v1`, with validation of chapter IDs, choices, confidence levels, and bounded source snapshots.

Readers can report that their local chapter tests passed. The progress view explicitly identifies these as self-reported, never server-verified. A confirmation is bound to the exact draft and cleared on editor changes or code transfer. The continue link selects the first unconfirmed chapter. Carrying code into the next editor has an undo action that restores that editor's previous draft; undo is available until used or the page is reloaded. Existing drafts are preserved when upgrading.

Enhancement verification: 550 unit tests and 18 production browser checks passed across Chromium, Firefox, and WebKit; lint, production build, and diff whitespace checks passed. The additional browser scenario verifies confidence feedback, persistence, reversible code transfer, and invalidation of self-reported test progress after editing. Live Java execution remains deferred.
