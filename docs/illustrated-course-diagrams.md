# Illustrated course diagrams

The illustrated presentation now covers every authored course diagram (135 at
this change), tutorial and mechanism flows, system-design overviews and visual
guides, AI lesson pictures, Design Lab patterns and workflows, System Canvas,
HLD/LLD solution boards, editable revisions, and Time Machine before/after views.
DSA input bars and character cells use the same pastel palette while retaining
live values, pointer annotations, active positions, and animation controls.

The original three topic-specific drawings remain for JVM process memory,
gateway trust boundaries, and Strategy pricing. All other course diagrams use
`DiagramArtwork`, which draws every authored node and directed relationship.
Its numbered connection key retains full labels without crowding the arrows.
Numbers identify connectors and do not imply execution order. Every directed
connector has its own path and marker. Long labels grow the node and export
height rather than being truncated. Isolated nodes, cycles, separate paths,
branches, and reverse arrows remain part of the model.

The common renderer uses explicit, stable node IDs for decorative symbols, never
localized display text. Unknown roles use a neutral component symbol. Symbols
and pastel colors are decorative; the authored labels and relationships carry
the technical meaning. AI comparison lessons have no implied execution edges.
Supported explicit arrow chains can be illustrated; unsupported tree or Mermaid
notation retains its complete source in a framed SVG of the original layout,
with enlargement/export and no invented links. The original selectable text
also remains available.

Course pictures retain Diagram/Text view switching. Shared lesson illustrations
include enlarge/reset, standalone SVG downloads, a keyboard-scrollable canvas,
and the original text explanation. Export dimensions come from each SVG's
viewBox, including its full connection key. Downloads contain fonts, colors,
marker definitions, title, and description; no external images are required.
Existing design-board zoom/fit/export and editable revision controls remain.

`lib/diagramArtwork.mjs` validates graph endpoints and duplicate IDs before
layout. `lib/illustratedCourseDiagrams.mjs` additionally checks the explicit
contracts of the original three drawings; changed valid topologies use the
common renderer. These guards supplement the existing catalog validity gate.
React 19's generated IDs stay inside SVG/ARIA references; selectors use data
attributes rather than unescaped generated IDs.

## Semantic review

These are conceptual diagrams, not deployed-system evidence or memory-size
measurements. The JVM image is explicitly a HotSpot map, not to scale. Shared
heap and per-thread stack semantics were checked against the
[Java SE 21 JVM specification](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5).
Implementation-specific regions and process budgeting are supported by Oracle's
[Native Memory Tracking guide](https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html).
The gateway picture preserves the existing lesson's authentication and resource
authorization boundaries; it depicts an illustrative service design, not a
guarantee supplied by [HTTP intermediaries](https://www.rfc-editor.org/rfc/rfc9110.html#section-3.7).
The Strategy example preserves construction-time policy selection and the
existing $100/$90 calculation; common interface implementation was checked
against [JLS 21, chapter 9](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html).

Independent review covers each connector's direction and endpoint, distinction
between containment and runtime calls, and exported SVG behavior. Boundary
tests exercise null/missing/malformed data, duplicates, reordered nodes and
edges, and changed topology. Browser regressions exercise every public course renderer, individual marker
paths, label bounds, enlargement/reset, keyboard text-view switching, retained
relationships, export rendering, mobile overflow, and workspace wiring.
There is no asynchronous job ownership, cancellation, persistence, external
effect, or Java code change in this presentation feature. Existing Java fixture
registration remains owned by the complete tech-blog gate.

Run `npm run verify:tech-blog` on the final source snapshot. Passing only the
illustration tests does not satisfy the mandatory completion gate. Real device
and assistive-technology testing remain outside browser emulation.

## Rollout verification

`test/diagramArtwork.test.mjs` compares all normalized course nodes and edges
against the authored catalog, checks reverse/bidirectional/separate paths,
comparison semantics, malformed data, node growth, isolated nodes, and cycles.
`e2e/illustration-rollout.spec.js` is registered in the mandatory gate. It covers
exports, enlargement/reset, text switching, public/mobile route families, AI
focus changes, Design Lab steps, revision warnings, and DSA input values. The
existing broad label-bounds tests now reject any remaining old course renderer.
The gate also retains the original content, practice, Book Mode, and reader
checks. Runtime versions and conceptual teaching boundaries are unchanged.

Validation uses a frozen workspace copy when unrelated tasks are editing shared
files. Record the actual final gate report and final visual review alongside the
task evidence; a preflight build or focused suite is not a release-gate pass.
