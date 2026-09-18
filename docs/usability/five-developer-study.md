# Five-developer reading and practice study

Prepared study plan; no sessions have been conducted and no results are claimed.

## Participants and consent

Recruit five developers across experience levels (at least two who have never seen the site). Include two mobile users, one tablet user if available, and two desktop users. Record their actual device, browser, familiarity with Java/backend systems, and whether they have visited before. Do not combine their prior familiarity with observed usability success.

Invite individually with this draft (not sent):

> Would you spend 20 minutes trying a developer learning site? We are testing the site, not you. You can stop at any time. We would like to watch how you find and read something useful and return to a saved practice session. Screen/audio recording is optional and requires your consent. Please use fictional examples and close private work before sharing your screen.

Ask separately for recording consent. If declined, take anonymous notes. Use participant codes P1–P5. Agree the retention period and who may access recordings before collecting any. Avoid recording real source code, credentials, private logs, or personal account information.

## Setup

Use the same deployed build for all participants and record its commit/build identifier. Use a fresh browser profile for first-visit tasks. Provide a prepared practice draft in a separate test profile for the resume task; explain only that it was started previously. Verify the deployed build and test accounts before each session. Do not change the site midway through the five sessions; log any unavoidable change.

## Moderator script

Start: “Please use the site as you normally would. Say what you are looking for and what you expect to happen. I will mostly stay quiet. There is no right answer.”

Give one task at a time, without naming menu items or routes:

1. “Find an article or investigation that looks useful for something you work on. Tell me why you chose it.” (Allow 4 minutes.)
2. “Use it to understand one idea. Explain that idea in your own words and show me what makes you trust—or doubt—the explanation.” (Allow 7 minutes.)
3. “Save the specific part you would want to revisit or send to a colleague. Leave the page and find that part again.” (Allow 3 minutes; do not send a message to anyone.)
4. In the prepared practice profile: “You started an answer earlier and had to stop. Return to it and continue.” (Allow 4 minutes.)

If someone stalls, wait before asking: “What are you looking for?” Do not say where to click. After an abandonment or time limit, ask what they expected, then record any assistance separately. A task completed with guidance is not an unassisted success.

Finish: “What would bring you back? What would stop you trusting or using this site? Which one thing would you change?” Do not ask whether they “like” a proposed feature before hearing their own priorities.

## Capture

Use `observations.csv`. Record timestamps, navigation choices, exact participant comments with permission, scroll traps, misunderstood labels, trust checks, and the first hesitation. Separate observation from interpretation. For the concept explanation, compare against the article's core mechanism; do not grade eloquence.

Outcomes: unassisted success, assisted success, abandoned, or time limit. Mark false confidence when someone reports success but resumes the wrong draft or explains a materially wrong mechanism. Note whether a saved bookmark or section link survived navigation and reload.

## Synthesis

For each task, report the raw count out of five, the device/browser, and the most consequential failure. Five sessions identify problems; they do not establish a statistically reliable conversion rate. Prioritize issues by task blockage, recurrence, and severity. Fix the top three and retest those tasks with new participants. Do not replace observation with another feature vote.

Report template:

- Build and session dates:
- Participant/device mix:
- Unassisted / assisted / abandoned counts by task:
- Three observed problems, with evidence and affected devices:
- Misleading trust signals or incorrect concept takeaways:
- Proposed fixes and what a successful retest would show:
- Limitations and untested situations:
