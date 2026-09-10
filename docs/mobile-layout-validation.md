# Mobile layout and guide regression checks

At widths up to 1023px, Navigation & settings and Session actions are collapsed
by default. Prep settings opens the existing controls; Start remains beside
the composer. The main shell cannot become a focus-driven horizontal scroller.
Dashboard section navigation and section headings remain in normal flow.

Keyboard mode follows visual viewport height and vertical offset, hides global
controls, and retains the compact composer. Blur does not restore the full
layout until the visible viewport recovers. Mobile form text is at least 16px;
pinch zoom is not treated as keyboard panning.

Regression coverage: `e2e/mobile-layout-regression.spec.js`,
`e2e/keyboard-viewport.spec.js`, `test/viewportMode.test.mjs`, and
`test/blind75Guide.test.mjs`. Chromium and WebKit viewport-event simulations
do not establish physical iOS keyboard compatibility. After deployment, check
portrait/landscape, keyboard opening/closing twice, switching inputs, retained
drafts, pinch zoom, and reachability of the final line and Send on an iPhone.

Guide chapters match normalized document titles to stable question IDs, not
roster order. The existing roster contains Binary Search, which is absent from
the supplied DOCX: its reader reports absence rather than showing a different
answer. The document's Product of Array Except Self is chapter 7, though the
roster displays it at position 6. Reader requests use a versioned query to avoid
reusing previously cached, incorrectly mapped chapters.
