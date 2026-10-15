# Book Mode

Select **Open Book Mode** on a public article or inside a workspace tech-blog
lesson. Book Mode opens a native modal; **Exit Book Mode** or Escape returns to
the regular reader at the current passage. The regular reader remains the default.

## Available readers

- All catalog tech-blog courses, including backend field notes, on their public
  pages and in the workspace’s full lesson reader.
- Java articles, tutorials, and question lists; Spring, SQL, Python, AWS,
  JavaScript, and system-design articles; stack interview guides.
- Engineering symptom articles, When Advice Fails, Explain This Log, resources,
  scenario exercises, weekly editions, and the AI engineering and Spring
  transaction learning journeys.
- Senior Java interview guide parts, companion Java files, and daily sets.

Indexes, roadmaps, dashboards, labs, and live practice tools retain their existing
layout. Book Mode is intended for reading a lesson, not navigating a catalog or
running a practice session. Chapter links navigate to the regular destination
reader, where Book Mode can be opened again.

## Reading and interaction

Desktop uses two facing pages. Screens at or below 900px use a single page.
Reading settings offer Paper, Sepia, and Dark themes, 16–22px text, serif or sans
serif type, line spacing, and a wide single-page layout. Arrow keys or Page Up /
Page Down turn pages when the Book pages region is focused. Keyboard navigation
inside code, tables, and form controls retains its normal behavior.

Contents jumps to a heading. Existing section URLs also open at their requested
passage. Changing fonts, layout, or viewport size repaginates around a semantic
content position rather than an obsolete page number. Position and validated
settings are stored locally in this browser; unavailable browser storage does not
prevent reading. There is no account or cross-device synchronization.

The reader reuses the existing lesson DOM. Open answers, interactive demo steps,
exercise drafts, and diagram controls survive regular → book → regular switches.
Article search, bookmarks, section links, and code-copy controls remain connected
to the same content. These controls retain their existing local-storage and
clipboard limitations; opening Book Mode does not upload or synchronize work.

Code and tables stay together and scroll within the page when taller than it.
Use **Reading settings → Expand code or table** to inspect an entire block in a
larger modal, or **Expand diagram** for artwork. Diagrams retain their view
controls in the expanded view. Escape closes the expanded view first, then Book
Mode, then the workspace lesson reader when applicable. The original lesson and
its section IDs are restored when the expanded view closes. Printing exits Book
Mode and prints the complete regular article rather than the current spread.

## Verification

`e2e/book-mode.spec.js` discovers every catalog course and checks desktop
pagination, preserved published examples and open answers, reaching final
sections, and returning to the same passage. Additional regressions exercise
mobile reading across public route families, live demo and diagram controls,
expanded code, article search/bookmark/copy continuity, unsaved exercise drafts,
client navigation, nested Escape handling in the workspace, and complete readable
PDF output when printing from Book Mode.

The existing `e2e/senior-java-guide.spec.js` retains coverage of guide position
transfer, settings/reflow, final spreads, companion-code scrolling, and unavailable
storage. Both specs are included in the mandatory `npm run verify:tech-blog` gate,
which also runs unit tests, Java behavioral checks, lint, production build, and
the existing public/workspace course and diagram browser suites. Test execution
results must be recorded separately; this document describes the intended scope.
Chromium emulation is not physical-device or assistive-technology acceptance
testing.
