# Engineering Time Machine pilot

Public route: `/time-machine/database-decisions`. Linked from the reading homepage, reading paths, and sitemap. The pilot follows one fictional relational-database design through traffic growth, regional recovery, and deletion requirements. It is an editorial learning exercise, not a benchmark, legal determination, architecture recommendation for a real deployment, or scored exam.

Each turning point records a choice and optional reasoning, reveals consequences, and compares all three alternatives. Earlier choices affect the deletion inventory: a catalogue cache requires checking data scope, sharding requires routing, and remote standby choices require replay/promotion checks. Shared invariants and a next evidence-gathering step accompany each choice. PostgreSQL 18 official documentation is linked for query-plan and replication mechanisms.

Local progress uses `interviewiq.timeMachine.database.v1`. Only a valid sequential prefix of known choices is restored; notes are bounded to 800 characters. Rewinding removes the last decision; undo restores it until another decision is recorded or the page reloads. No AI calls, service credentials, new dependencies, or backend writes are required.

Sharing encodes only a versioned sequence of known choice IDs in a descriptive URL. Written reasoning is excluded. Shared paths appear in a separate read-only panel and never overwrite the recipient's local work. Invalid versions/choices are rejected. Clipboard failures provide a selectable URL. Downloading Markdown explicitly includes personal reasoning and links back to the lesson. This is a small artifact-sharing capability, not a general explanation studio or embeddable diagram editor.

Pilot evaluation before expansion: watch five developers explain which constraints changed and what they preserved, whether the consequences influenced a revision, and whether a shared path is understandable without the sender. Record completion, reasons for abandoning, and voluntary sharing in the existing usability study notes. No participant sessions or engagement results are claimed. No tracking is added by this pilot; aggregate usage needs a separately defined analytics experiment.

Verification commands: `npm run test:unit`, `npm run lint`, `npm run build`, and production Playwright `e2e/time-machine.spec.js` across Chromium/Firefox/WebKit. Unit tests cover all 27 complete share paths, malformed state, bounded notes, inherited obligations, and summary attribution. Browser checks cover decision transitions, focus, reload, rewind/undo, download content, share privacy, invalid links, clipboard fallback, and scroll at phone/tablet/desktop widths.

Verified September 18, 2026: 554 unit tests and 18 production browser checks passed. Browser coverage spans Chromium, Firefox, and WebKit at 390, 412, 768, and 1440 pixels. ESLint, production build, and diff whitespace checks passed. Physical-device testing and real participant evaluation have not been performed. No deployment was made.

## Before/after design views

Each recorded decision has an expandable design view; the latest decision also shows it directly before the alternative comparison. Shared paths reproduce the same diagrams without adding personal notes to the URL. Responsive HTML component boxes and directional relationship lists provide the same information as text to assistive technology; Added, Changed, and Unchanged are explicit labels, not color-only distinctions. At narrow widths Before and After stack vertically.

`lib/timeMachineDesign.mjs` derives each snapshot from the valid decision prefix. Earlier topology and duties persist: cached catalogue reads do not move checkout into the cache; sharded orders require replication per data owner; replacing a database is shown as a proposed migration, not proof that existing copies disappeared. Deletion workflows connect to the selected serving copies and the restore procedure. Each obligation names the turning point that created it and identifies whether it is new or inherited. These are conceptual responsibility diagrams, not deployed infrastructure or performance evidence.

Diagram unit checks cover all 27 paths, graph endpoint integrity, snapshot continuity, cache/checkout separation, sharded replication, deletion scope, and obligation provenance. Browser checks exercise decision and rewind updates, shared diagrams, and expanded scrolling at phone/tablet/desktop widths.

Before/after enhancement verification: 558 unit tests and 30 production browser checks passed across Chromium, Firefox, and WebKit. ESLint, production build, and diff whitespace checks passed. Expanded diagrams were checked for horizontal overflow and reachable obligation details at phone, tablet, and desktop widths. No deployment was performed.
