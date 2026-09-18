# Reader experience completion map

This maps the requested product list to implemented routes. Deployment is separate
from local implementation and verification.

| Requested capability | Implementation |
| --- | --- |
| Focused homepage and three starting points | `/`, with resume, symptom search and selected paths; full catalogue at `/explore` |
| Engineering Symptoms Atlas | `/symptoms`, ten Java/Spring entries with evidence and reproduction fixtures |
| Production Detective | `/detective`, five cases with evidence, alternatives, repairs and trade-offs |
| Connected learning path | `/learn/spring-transactions`, symptom → lesson → case → code → transfer scenario → reflection |
| Personal notebook | `/notebook`, saved sections, investigations, project shortcuts, decisions, reflections and interview answers; Markdown export |
| Explanation practice | Reflection at each detective case plus the Spring journey; editorial comparison and evidence that would change the diagnosis |
| Five tiny systems | `/build`: existing dependency injection plus retry scheduler, inverted index, connection pool model and write-ahead log model |
| Engineering Time Machine | `/time-machine/database-decisions`, changed constraints, before/after diagrams and side-by-side alternatives |
| Editorial trust | Sources, author credit, unassigned reviewer disclosure, runtime/model scope, update dates and `/corrections` |
| Interview conversion | Completing any detective case unlocks a tailored interview prompt, saved written answer, self-assessment and answer guide |
| Fast, accessible reading | Static public pages, deferred article tools/icon CSS, explicit scroll containers, reduced viewport prefetch and responsive checks |
| Weekly publishing | `/weekly`, permanent dated editions, spoiler-free sharing, RSS entries, existing consent-based digest integration |

## Four additional projects

Each has three chapters. A chapter includes the earlier reference methods, a
new unimplemented method, cumulative assertions, an editable draft, downloadable
`Main.java`, reference comparison, and a statement of the next limitation.
Earlier learner code is retained in its own chapter rather than silently
substituted into the next starter. Saved check marks are explicitly self-reported
and are cleared when code changes. No Java is executed on the website.

The Java skill guided deterministic tests, Java 8 compatibility, resource
ownership checks, and clear teaching boundaries. The retry scheduler uses virtual
time and an in-memory queue. Search uses ASCII tokens and set intersection.
The pool models two integer resources and exception-safe return. The log models
ordering and replay in memory, not physical persistence or crash durability.

Run `npm run test:tiny-systems` to compile and execute only the trusted repository
starters and solutions. It checks both expected starter failures and reference
successes for all 12 chapters. Java 8 source compatibility is checked with
`javac --release 8`; execution was verified on Temurin 21.0.9.

## Boundaries

- Notebook and drafts remain local to the browser; there is no implied cloud sync.
- Interview checklists are self-assessments, not automated correctness scores.
- Live Java execution and Gemini calibration remain deferred by user choice.
- Email delivery still needs a configured provider; explicit subscription consent
  and confirmation remain required.
- Weekly publication uses explicit reviewed editions. This change does not
  schedule unattended content publication or claim a future publishing streak.
- The five-developer study is prepared in `reader-learning-experience.md`; no
  real participants were recruited or observed by this implementation.

## Verification for the final additions

- Production build and ESLint passed; all 570 unit tests passed.
- Twelve chapter starters compiled and failed at their intended unfinished
  method; all twelve corresponding reference implementations compiled and
  passed their assertions on Temurin 21 with Java 8 source compatibility.
- All 87 browser checks for the new projects, detective cases and connected
  journey passed across Chromium, Firefox, and WebKit. This includes draft
  reload, completion invalidation, downloads, notebook answers and export,
  storage failures, RSS/sitemap discovery, accessibility, and responsive layout.
- Mobile screenshots were inspected; editors reuse the existing monospace
  chapter styling. Browser emulation is not physical-device testing.
