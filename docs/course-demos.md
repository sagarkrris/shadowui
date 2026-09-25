# Interactive course demos

Every entry returned by `listTechBlogs()` has an explicit assignment in
`lib/courseDemos.mjs`. The same `CourseDemo` player appears in public articles
(including field notes) and the workspace reader. These are course-level
demonstrations, not one simulation per chapter.

## Add a course

1. Assign one or more relevant demo IDs in `COURSE_DEMO_ASSIGNMENTS`. Reuse a
   demo only when it teaches a mechanism in the course.
2. For a new scripted walkthrough, supply named state lanes and at least two
   contrasting scenarios. Every step supplies a title, causal explanation,
   and a value for every lane. State the teaching model's limits and include
   a question for the reader. Do not represent a scripted trace as a live runtime.
3. For computed simulations, add a pure deterministic model in
   `lib/courseDemoModels.mjs`, bounded controls in the player, and behavior tests.
   Do not execute learner-provided code or make external requests.
4. Run `node --test test/courseDemos.test.mjs` and
   `npx playwright test e2e/course-demos.spec.js --project=chromium`.

The coverage test intentionally fails when a newly added course has no demo.

## Playback contract

- Start paused; play advances once per selected interval and stops at the end.
- Back/next pause; reset rewinds while retaining scenario, inputs, and speed.
- Input changes rewind and pause. Selecting another demo or course creates a
  fresh player. Closing the workspace reader removes timers.
- Hide the browser tab to pause. Returning does not automatically resume.
- Native buttons and selects support keyboards; no keyboard shortcuts capture
  typing. State changes are described in words as well as color.
- Reduced-motion preferences disable transitions. Playback is user initiated;
  live announcements are muted during playback to avoid continuous speech.
- Mobile state cards stack; controls wrap and have 44px minimum height.
- Bookmarks, sharing, and reading-position links target the stable course demo
  section, not temporary headings inside a selected player. Article search reads
  the current player content. A section link does not persist simulation inputs.
- Change indicators compare cell values with the preceding frame. A teaching
  highlight must not be used to claim a value changed when it stayed the same.

## Verification scope

Routing, hash membership, and reconnect demos calculate state from bounded
inputs. Other demos are authored contrasting traces. None simulates full JVM,
database, proxy, security, or distributed-system behavior. Scope notes remain
visible in the player so readers can distinguish the model from production.
