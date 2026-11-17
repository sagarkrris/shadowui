# Site audit remediation

This change addresses the authenticated browser audit of elevateprep.vercel.app.
It changes local source only; production deployment is a separate action. Existing
work in the checkout is preserved.

## Practice and feedback

- Allow the fixed practice shell to scroll on short screens; compact composer tools.
- Keep cloud-copy conflicts outside mobile navigation, with both-copy download and explicit resolution.
- Identify previous completed reviews separately from active/unfinished requests.
- Request numeric grading only for an actual candidate answer. Display imported placeholder grades as unassessed.
- Exclude screenshots and known generated requests from rewrite/coverage tools.
- Preserve candidate claims in draft variants; show format guidance separately. Label the explanation checklist as keyword coverage rather than correctness.
- Keep the mobile Polish action visible and display labels above prep settings.

## Learning and discovery

- Consolidate AI Engineering categories and deduplicate global-search destinations.
- Include the parent article in section bookmarks, including existing saved bookmarks.
- Use shared article editorial metadata in reader tools.
- Give preparation checkboxes activity-specific accessible names.
- Validate cache capacity as a nonnegative integer and honor zero capacity.
- Prevent SQL lesson tiers from stretching and overlapping on mobile.
- Compact saved-learning shortcuts behind a disclosure and offer returning profiles a resume action.
- Honor homepage pagination when search is empty.
- Link the Node roadmap stage to a concrete validation/cancellation exercise.
- Publish recent scenarios through the scenario reader, including the code-comprehension link.

## Content and workspaces

- Expand nine stack guides with worked answers, examples, trade-offs, verification and follow-ups.
- Fulfill the seven interview listicles' advertised question counts while retaining their original questions and collapsed answers.
- Supply a substantive Microservices pack answer and label other coaching prompts honestly.
- Qualify HashMap tree-bin complexity and conversion rules.
- Initialize the Spring notification registry's required provider map through constructor injection.
- Fix stock-problem example explanations and display the visualizer's actual profit state.
- Open Java practice exercises in a dedicated editor with independent drafts, correct reverse-string checks and local download.
- Require an explicit microphone action for each Tech Buddy voice answer, including offline interview flow.
- Preserve readable diagram connection text in dark and light themes.

## Operational dependency

The web UI can report that online Java execution is unavailable and supports local
download. A live runner still requires separately provisioned infrastructure and
server configuration; these changes do not provision or deploy it. Follow
[the build practice guide](build-practice.md) and
[runner deployment guide](../services/java-runner/README.md). Mocked browser and
adapter tests do not prove live sandbox isolation or availability.

## Verification

Regressions cover answer provenance, missing grades, constructor behavior, scenario
resolution, learning persistence/search, cache boundaries, Node cancellation,
stock traces, explicit microphone activation, and runner editor behavior. Browser
checks cover short screens, mobile sync recovery and affected learning flows.
The required final check is `npm run verify:tech-blog`, which includes the focused
audit, accessibility, practice, sync and voice regressions against the final build. See the
completion report for actual results and any remaining validation limits.
