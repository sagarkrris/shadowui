# Interview answer standard

Interview lessons must teach a beginner without stopping at a definition, and
give an experienced candidate enough substance to defend a design decision.
Use this progression for new and revised answers:

1. **Beginner:** define the idea and unfamiliar terms in plain language. State
   what problem it solves and distinguish the nearest confusing concept.
2. **Mechanism:** explain the actors, ownership, steps and actual guarantee.
3. **Applied design:** walk through a concrete example with stated assumptions,
   units and a success criterion. Illustrative figures are not benchmarks.
4. **Deep dive:** explain trade-offs, realistic failure or concurrency boundaries,
   alternatives and how to verify the claim. Avoid absolute guarantees that the
   mechanism cannot provide.
5. **Interview answer:** provide a complete, natural spoken answer, rather than
   instructions such as “mention trade-offs” without supplying those trade-offs.
6. **Follow-up:** include a plausible interviewer question and its explained answer.

Link primary documentation for technical claims. Mark conceptual scenarios and
contextual snippets honestly; do not imply a deployed system or tested framework
application. Runnable examples need their applicable behavioral fixture.

Use progressive disclosure for depth, while keeping the beginner explanation
and complete interview answer immediately available. Each lesson must make sense
independently. Preserve accessible headings, keyboard controls, section links and
bookmarks. Validate rendering and behavior, not only content presence or length.

The system-design visual guide implements this standard for all fifty concepts
in `lib/systemDesignConceptLessons.mjs`. Its examples include capacity units,
error-budget arithmetic, stale cache fills, ambiguous commit outcomes, ordering,
tenant isolation, migration and recovery boundaries. No Java runtime or new
`javaRelease` course is introduced by these conceptual lessons.

Run the complete mandatory tech-blog gate after changes. Its focused browser
regressions also check all four learning levels, global expansion/collapse,
keyboard disclosure, article search, deep links, bookmarks and accessibility.
