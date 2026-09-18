# Connected reader experience

The public homepage leads with three intents: diagnose, learn, and interview
practice. `/explore` keeps the full catalogue discoverable. Homepage content
stays statically generated; shared navigation avoids viewport prefetch.

## Shipped surfaces

- `/learn/spring-transactions`: five self-reported steps connecting the existing
  symptom, lesson, detective case, editable local Java repair exercise, and
  transfer scenario. Includes the boundary comparison, verification limits,
  official Spring source, and saved reflection.
- `/notebook`: browser-local reflections, learning steps, saved article sections,
  and links back to code drafts and decisions. New detective activity creates a
  resume entry; new Time Machine decisions save a readable summary. Export is
  selectable Markdown. No cross-device sync is promised.
- Every detective case now has “Explain your diagnosis”: failure, evidence,
  repair/risk, and evidence that would change the reader's mind. Comparison uses
  existing editorial content; it does not claim to grade free text.
- `/weekly` and `/weekly/2026-09-18-transaction-boundaries`: first editorial
  edition with stable spoiler-free sharing, investigation and learning links.
  Future editions require editorial publication; no scheduler or email delivery
  service is enabled by this change.

Notebook values are bounded and normalized. Links must be relative local paths.
Storage failures leave the exercise usable and show a message rather than
claiming the note was saved. Notes contain user writing; they are not sent to
analytics. Original exercise, investigation, and timeline storage remain intact.

## Weekly publication checklist

1. Choose one existing investigation and validate its evidence, alternatives,
   repair, limitations, links, and runtime claims against primary sources.
2. Run its content fixtures and browser interaction checks. Record scope honestly;
   a browser model is not a Spring or database integration test.
3. Add one immutable dated entry to `lib/weeklyChallenges.mjs`. Never recycle a
   published slug for a different case. Build, verify, and deploy the edition.
4. Update the homepage feature intentionally. Publish a digest only when ready;
   email remains dependent on configured delivery and explicit consent.
5. Review case completion, return visits, and share visits using the existing
   detective analytics. Copied links do not establish that sharing occurred.

## Five-developer usability pilot

This is a session guide, not evidence that user research has already occurred.
Recruit five developers, obtain their consent for any recording, and avoid
coaching them through the interface. Give each participant these tasks:

1. Find something relevant to a backend problem they encountered recently.
2. Use a lesson or case to explain one mechanism in their own words.
3. Save unfinished work, leave the page, and resume it.
4. Explain which evidence would make them revise their diagnosis.

Record device, first chosen link, time to meaningful content, hesitation points,
wrong turns, abandonment, and whether resumption succeeded without help. Ask
what made the explanation trustworthy or doubtful. Do not treat five sessions
as a statistically representative conversion estimate. Prioritize repeated
obstacles before creating more scenarios.

## Release limits

Live Java execution and Gemini calibration remain deferred. Individual human
reviewers are not invented. The production deployment and real-device testing
must be verified separately; local browser emulation is not a physical phone.

## Local verification

- Production build and ESLint passed.
- 567 unit tests passed, including bounded notebook normalization, safe local
  links, preservation of other notes, storage failures, and all reader bookmark
  subjects.
- All ten symptom fixture checks passed. The journey starter was separately
  compiled and failed its intended boundary assertion; the reference repair
  compiled and passed. No live Spring transaction was executed.
- The homepage initial JavaScript gzip estimate remains about 132 KB versus
  268 KB before the loading fixes (51% smaller). This is not a browser latency
  measurement.
- Browser validation covered 147 distinct checks across Chromium, Firefox, and
  WebKit. The main run passed 143/144; the remaining mixed-input WebKit test was
  rewritten as a complete keyboard flow with a separate mobile pointer flow.
  All six focused keyboard/pointer checks then passed. Coverage includes
  persisted notes, exercise drafts, exports, blocked storage, sharing,
  accessibility, existing experiences, and phone/tablet/desktop widths.
- Desktop homepage and mobile journey screenshots were visually inspected.
