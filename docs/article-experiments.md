# Article experiments and learning resume

The three backend field notes now include a deterministic prediction loop. Readers choose a condition, predict the outcome, record confidence, run the model, and explain the result. A changed input clears the prior result and explanation so feedback always belongs to the displayed attempt. The last attempt is saved locally, including its original prediction and confidence; it is not a scored assessment or a history of calibration over time.

Models cover retained versus new payment identity, connection ownership duration, and standby log durability. They mirror the articles' simplified examples, execute no reader code, make no API calls, and state their limits beside the controls.

`interviewiq.articleExperiments.v1.<article-id>` stores the experiment. `interviewiq.learningResume.v1` stores at most 12 recent learning pages, with section anchors when available. The homepage displays the latest three and retains the existing notebook/practice shortcuts. Reading, scrolling, and interactions update the position; merely opening a page does not mark it complete. Investigation state and workshop code remain in their existing storage. Data is browser-local and is not synchronized across devices.

Resume tracking loads on article, investigation, and tiny-system detail pages only. It uses existing scroll containers and anchors, batches storage writes, and requires no new dependency. Blocked storage leaves the models usable; experiment controls report that work cannot be saved.

Validation covers both outcomes for each model, malformed saved data, unsafe resume links, storage failure, reload persistence, chapter/evidence recovery, narrow-screen overflow, and automated accessibility.

Local verification: 579 unit tests; production build; focused ESLint and whitespace checks. The browser suite covers Chromium, Firefox, and WebKit at phone, tablet, and desktop widths. The homepage remains statically generated; its build-manifest JavaScript totals 132,383 gzip bytes (this excludes HTML, CSS, and later on-demand requests and is not a live-site timing measurement).
