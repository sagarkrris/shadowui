# Blind 75 Visual Track Design

## Goal

Add a Blind 75 Visual Track inside the existing DSA Visual Lab so users can learn the most common interview problems through reusable pattern visualizers, original explanations, selected-stack code templates, quizzes, and "Practice as Mock" actions.

## Scope

- Add a full 75-question roadmap using original summaries and coaching copy.
- Mark the most interview-useful 15 as featured so the first view is focused instead of a long list.
- Reuse one strong visualizer per pattern: Arrays & Hashing, Two Pointers, Sliding Window, Stack, Binary Search, Linked List, Trees, Graphs, and DP.
- Map supporting Blind 75 topics such as heap, trie, intervals, matrix, greedy, and bit manipulation onto the closest visual state panel while keeping their problem metadata visible.
- Show Java, Python, and JavaScript code templates based on the selected profile stack, with Ruby/Rust fallback behavior preserved.

## Architecture

- `lib/blind75VisualTrack.mjs` owns the Blind 75 metadata, featured list, problem-to-visualizer mapping, original problem summaries, invariants, dry-run copy, edge cases, quizzes, mock prompts, default inputs, and problem-aware code template builders.
- `lib/dsaVisualLab.mjs` remains the visual engine. It accepts core lessons and Blind 75 lessons through the same lesson shape, then enriches steps with pattern-specific state panels and stack-aware code.
- `components/dsa/DsaVisualLab.js` adds an Interview Core / Blind 75 segmented track, a featured/all filter, and problem cards that drive the existing theater.

## Data Flow

1. The DSA Lab loads core lessons and Blind 75 problems.
2. In Core mode, existing lessons work as they do today.
3. In Blind 75 mode, selecting a problem converts it to a lesson-compatible object with a visualizer id.
4. `buildDsaVisualizationState` normalizes the problem default input, enriches each step, and sends the result to the theater.
5. `getDsaCodeTemplate` chooses Java, Python, or JavaScript using the profile stack, then returns the problem-aware template when available.
6. "Practice as Mock" sends the Blind 75 problem prompt plus current state to the existing mock launcher.

## Testing

- Unit tests verify there are exactly 75 Blind 75 problems, exactly 15 featured problems, no duplicate ids, and every problem has summary, invariant, edge cases, quiz, mock prompt, default input, and visualizer mapping.
- Unit tests verify every requested visualizer type is represented.
- Unit tests verify a featured problem creates visual steps with narration, state panel, invariant, and interview script.
- Unit tests verify Java, Python, and JavaScript templates are selected correctly for Blind 75 problems.
- UI source tests verify the DSA Lab exposes Blind 75 Visual Track, Featured 15, All 75, pattern cards, and Practice as Mock.

## Self-Review

- No placeholder requirements remain.
- The feature is scoped to the existing DSA Lab instead of adding a separate route.
- The data layer uses original app-authored explanations and does not copy NeetCode content.
- The implementation can ship incrementally: all 75 metadata is present, while the strongest visual experience starts with reusable pattern visualizers and featured problems.
