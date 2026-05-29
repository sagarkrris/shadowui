# DSA Confidence Trainer Design

## Goal

Upgrade DSA Visual Lab from a visual catalog into an interview confidence trainer. A user should be able to open any Blind 75 problem, see why the pattern works, walk the code in their selected stack, test edge cases, save mistakes, and filter the roadmap by readiness.

## User Experience

The existing DSA Lab remains a first-class workspace with Interview Core and Blind 75 tracks. Blind 75 gains a trainer strip above the problem list with progress counts for mastered, weak, and not-started problems. The list can be filtered by Featured 15, All 75, difficulty, Weak, Not Started, or Mastered. Cards show the user's current readiness status so the roadmap feels alive.

Inside a selected problem, the trainer adds four learning surfaces:

- Pattern Mastery Mode: a six-step checklist for Understand, Visualize, Dry Run, Code, Test Cases, and Explain Complexity.
- Mistake Replay: locally saved weak spots for the current problem with one-tap actions for common interview misses.
- Code Walkthrough: current visual step mapped to the selected-stack code and interview explanation.
- Test Case Trainer: normal, edge, and trick cases with revealable expected output and a mastery action.

All progress stays in localStorage. No database is needed for this version.

## Data Model

Blind 75 problem metadata adds generated training content for all 75 problems:

- `masteryChecklist`: stable checklist items.
- `testCases`: at least normal, edge, and trick cases.
- `codeWalkthrough`: language-agnostic step-to-code explanations.
- progress helpers for local confidence state, mastery steps, mistakes, summaries, and filtering.

The app stores only small progress records keyed by problem id. It does not store answers, transcripts, or private resume content in this feature.

## Implementation Boundaries

This is scoped to `lib/blind75VisualTrack.mjs`, `lib/dsaVisualLab.mjs`, `components/dsa/DsaVisualLab.js`, tests, and README copy. The existing scroll fix must remain: the main workspace owns vertical scrolling and DSA Lab must not add a nested All 75 scroll trap.

## Verification

Automated tests must cover metadata completeness, progress helper behavior, lesson exposure, source-level UI surfaces, and the scroll-regression guard. Browser QA must open the app, personalize a Java profile, enter DSA Lab, use Blind 75 All 75, interact with trainer controls, and verify scrolling on mobile/tablet/desktop viewports.
